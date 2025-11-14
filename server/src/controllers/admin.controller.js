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
      timelineStats,
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
            orders: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.date": 1 },
        },
      ]),
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].total : 0;

    const paymentBreakdown = paymentStats.reduce((acc, stat) => {
      const key = stat._id || "unknown";
      acc[key] = {
        revenue: stat.revenue ?? 0,
        orders: stat.orders ?? 0,
      };
      return acc;
    }, {});

    const timelineMap = timelineStats.reduce((acc, item) => {
      const dateKey = item?._id?.date;
      const methodKey = item?._id?.method || "unknown";

      if (!dateKey) {
        return acc;
      }

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          codRevenue: 0,
          codOrders: 0,
          vietqrRevenue: 0,
          vietqrOrders: 0,
          otherRevenue: 0,
          otherOrders: 0,
        };
      }

      const target = acc[dateKey];
      const revenue = item.revenue ?? 0;
      const orders = item.orders ?? 0;

      if (methodKey === "cod") {
        target.codRevenue += revenue;
        target.codOrders += orders;
      } else if (methodKey === "vietqr") {
        target.vietqrRevenue += revenue;
        target.vietqrOrders += orders;
      } else {
        target.otherRevenue += revenue;
        target.otherOrders += orders;
      }

      return acc;
    }, {});

    const revenueTimeline = [];

    for (let index = 0; index < timelineDays; index += 1) {
      const cursor = new Date(startDate);
      cursor.setDate(startDate.getDate() + index);

      const dateKey = cursor.toISOString().slice(0, 10);
      revenueTimeline.push(
        timelineMap[dateKey] ?? {
          date: dateKey,
          codRevenue: 0,
          codOrders: 0,
          vietqrRevenue: 0,
          vietqrOrders: 0,
          otherRevenue: 0,
          otherOrders: 0,
        }
      );
    }

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        paymentBreakdown,
        revenueTimeline,
        timelineRange: {
          start: startDate.toISOString(),
          end: today.toISOString(),
        },
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
