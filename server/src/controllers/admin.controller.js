import { CUSTOMER_TIERS, determineCustomerTier } from "../constants/customer.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";

export const getOverviewStats = async (req, res, next) => {
  try {
    const timelineDays = 14;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (timelineDays - 1));

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      revenueResult,
      paymentStats,
      profitStats,
      timelineRevenueStats,
      timelineProfitStats,
      topProductStats,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$totals.grand" },
          },
        },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: "$paymentMethod",
            revenue: { $sum: "$totals.grand" },
            orders: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $unwind: "$items" },
        {
          $addFields: {
            listedPrice: { $ifNull: ["$items.listedPrice", "$items.price"] },
            salePrice: { $ifNull: ["$items.price", 0] },
            quantity: { $ifNull: ["$items.quantity", 0] },
          },
        },
        {
          $group: {
            _id: "$paymentMethod",
            profit: {
              $sum: {
                $multiply: [
                  {
                    $max: [
                      { $subtract: ["$salePrice", "$listedPrice"] },
                      0,
                    ],
                  },
                  "$quantity",
                ],
              },
            },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              method: "$paymentMethod",
            },
            revenue: { $sum: "$totals.grand" },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        { $unwind: "$items" },
        {
          $addFields: {
            listedPrice: { $ifNull: ["$items.listedPrice", "$items.price"] },
            salePrice: { $ifNull: ["$items.price", 0] },
            quantity: { $ifNull: ["$items.quantity", 0] },
          },
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              method: "$paymentMethod",
            },
            profit: {
              $sum: {
                $multiply: [
                  {
                    $max: [
                      { $subtract: ["$salePrice", "$listedPrice"] },
                      0,
                    ],
                  },
                  "$quantity",
                ],
              },
            },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),
      Order.aggregate([
        { $unwind: "$items" },
        {
          $addFields: {
            listedPrice: { $ifNull: ["$items.listedPrice", "$items.price"] },
            salePrice: { $ifNull: ["$items.price", 0] },
            quantity: { $ifNull: ["$items.quantity", 0] },
          },
        },
        {
          $group: {
            _id: "$items.product",
            name: { $first: "$items.name" },
            image: { $first: "$items.image" },
            quantity: { $sum: "$quantity" },
            saleRevenue: {
              $sum: { $multiply: ["$salePrice", "$quantity"] },
            },
            listedRevenue: {
              $sum: { $multiply: ["$listedPrice", "$quantity"] },
            },
            profit: {
              $sum: {
                $multiply: [
                  {
                    $max: [
                      { $subtract: ["$salePrice", "$listedPrice"] },
                      0,
                    ],
                  },
                  "$quantity",
                ],
              },
            },
          },
        },
        { $sort: { quantity: -1, saleRevenue: -1 } },
        { $limit: 6 },
      ]),
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].total : 0;

    const knownMethods = new Set(["cod", "vietqr"]);

    const paymentBreakdown = {
      cod: { revenue: 0, orders: 0, profit: 0 },
      vietqr: { revenue: 0, orders: 0, profit: 0 },
      other: { revenue: 0, orders: 0, profit: 0 },
    };

    paymentStats.forEach((stat) => {
      const method = knownMethods.has(stat?._id) ? stat._id : "other";
      paymentBreakdown[method].revenue += stat.revenue ?? 0;
      paymentBreakdown[method].orders += stat.orders ?? 0;
    });

    profitStats.forEach((stat) => {
      const method = knownMethods.has(stat?._id) ? stat._id : "other";
      paymentBreakdown[method].profit += stat.profit ?? 0;
    });

    const totalProfit = Object.values(paymentBreakdown).reduce(
      (sum, item) => sum + (item.profit ?? 0),
      0
    );

    const timelineMap = {};

    const ensureTimelineEntry = (dateKey) => {
      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = {
          date: dateKey,
          cod: { revenue: 0, profit: 0 },
          vietqr: { revenue: 0, profit: 0 },
          other: { revenue: 0, profit: 0 },
        };
      }
      return timelineMap[dateKey];
    };

    timelineRevenueStats.forEach((item) => {
      const dateKey = item?._id?.date;
      if (!dateKey) return;

      const method = knownMethods.has(item?._id?.method)
        ? item._id.method
        : "other";
      const entry = ensureTimelineEntry(dateKey);
      entry[method].revenue += item.revenue ?? 0;
    });

    timelineProfitStats.forEach((item) => {
      const dateKey = item?._id?.date;
      if (!dateKey) return;

      const method = knownMethods.has(item?._id?.method)
        ? item._id.method
        : "other";
      const entry = ensureTimelineEntry(dateKey);
      entry[method].profit += item.profit ?? 0;
    });

    const revenueTimeline = [];

    for (let index = 0; index < timelineDays; index += 1) {
      const cursor = new Date(startDate);
      cursor.setDate(startDate.getDate() + index);

      const dateKey = cursor.toISOString().slice(0, 10);
      const entry = ensureTimelineEntry(dateKey);
      entry.totalRevenue =
        (entry.cod.revenue ?? 0) +
        (entry.vietqr.revenue ?? 0) +
        (entry.other.revenue ?? 0);
      entry.totalProfit =
        (entry.cod.profit ?? 0) +
        (entry.vietqr.profit ?? 0) +
        (entry.other.profit ?? 0);

      revenueTimeline.push(entry);
    }

    const topProducts = topProductStats.map((item) => ({
      productId: item._id,
      name: item.name,
      image: item.image || "",
      totalQuantity: item.quantity ?? 0,
      listedRevenue: item.listedRevenue ?? 0,
      saleRevenue: item.saleRevenue ?? 0,
      totalProfit: item.profit ?? 0,
    }));

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        totalProfit,
        paymentBreakdown,
        revenueTimeline,
        timelineRange: {
          start: startDate.toISOString(),
          end: today.toISOString(),
        },
        topProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const listUserRankings = async (req, res, next) => {
  try {
    const rawLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 200)
      : 50;
    const sortMode = req.query.sort === "newest" ? "createdAt" : "lifetimeSpend";
    const sort = sortMode === "createdAt" ? { createdAt: -1 } : { lifetimeSpend: -1 };

    const users = await User.find()
      .select("name email customerTier lifetimeSpend createdAt updatedAt")
      .sort(sort)
      .limit(limit);

    res.json({
      success: true,
      data: users,
      meta: {
        limit,
        sort: sortMode,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either 'user' or 'admin'",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: "User role updated",
      data: {
        id: user._id,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRanking = async (req, res, next) => {
  try {
    const { lifetimeSpend, customerTier } = req.body;

    if (lifetimeSpend === undefined && customerTier === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing ranking data",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (lifetimeSpend !== undefined) {
      const spend = Number(lifetimeSpend);
      if (!Number.isFinite(spend) || spend < 0) {
        return res.status(400).json({
          success: false,
          message: "lifetimeSpend must be a non-negative number",
        });
      }

      user.lifetimeSpend = Math.round(spend);
      user.customerTier = determineCustomerTier(user.lifetimeSpend);
    }

    if (customerTier !== undefined) {
      if (!Object.values(CUSTOMER_TIERS).includes(customerTier)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer tier",
        });
      }

      user.customerTier = customerTier;
    }

    await user.save();

    res.json({
      success: true,
      message: "User ranking updated",
      data: {
        id: user._id,
        lifetimeSpend: user.lifetimeSpend,
        customerTier: user.customerTier,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete another admin account",
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: "User removed",
    });
  } catch (error) {
    next(error);
  }
};
