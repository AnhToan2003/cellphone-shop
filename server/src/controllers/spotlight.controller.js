import { Spotlight } from "../models/Spotlight.js";
import { Product } from "../models/Product.js";

export const getSpotlight = async (req, res, next) => {
  try {
    let spotlight = await Spotlight.findOne().populate("product");

    if (!spotlight) {
      // Find featured product or latest flagship product
      let product = await Product.findOne({ featured: true });
      if (!product) {
        product = await Product.findOne().sort({ price: -1, createdAt: -1 });
      }

      spotlight = await Spotlight.create({
        product: product?._id || null,
        badge: "SẢN PHẨM NỔI BẬT",
        title: product?.name || "",
        description:
          product?.shortDescription ||
          product?.description?.slice(0, 160) ||
          "Sở hữu ngay flagship mới nhất với ưu đãi đặc quyền và bảo hành chu đáo tại Ngọc Triết Store.",
        isActive: true,
      });

      if (product) {
        spotlight = await Spotlight.findById(spotlight._id).populate("product");
      }
    } else if (!spotlight.product) {
      // If product was null, try to reconnect to an existing product
      const product =
        (await Product.findOne({ featured: true })) ||
        (await Product.findOne().sort({ price: -1, createdAt: -1 }));
      if (product) {
        spotlight.product = product._id;
        await spotlight.save();
        spotlight = await Spotlight.findById(spotlight._id).populate("product");
      }
    }

    res.json({
      success: true,
      data: spotlight,
    });
  } catch (error) {
    next(error);
  }
};
export const updateSpotlight = async (req, res, next) => {
  try {
    const {
      productId,
      badge,
      title,
      description,
      customPrice,
      customOldPrice,
      customImage,
      link,
      isActive,
    } = req.body;

    let product = null;
    if (productId) {
      product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sản phẩm được chọn.",
        });
      }

      // Sync featured flag across products
      await Product.updateMany({ _id: { $ne: product._id } }, { featured: false });
      product.featured = true;
      await product.save();
    }

    let spotlight = await Spotlight.findOne();
    if (!spotlight) {
      spotlight = new Spotlight();
    }

    if (productId !== undefined) spotlight.product = productId || null;
    if (badge !== undefined) spotlight.badge = badge.trim();
    if (title !== undefined) spotlight.title = title.trim();
    if (description !== undefined) spotlight.description = description.trim();
    if (customPrice !== undefined) spotlight.customPrice = customPrice !== "" && customPrice !== null ? Number(customPrice) : null;
    if (customOldPrice !== undefined) spotlight.customOldPrice = customOldPrice !== "" && customOldPrice !== null ? Number(customOldPrice) : null;
    if (customImage !== undefined) spotlight.customImage = customImage.trim();
    if (link !== undefined) spotlight.link = link.trim();
    if (isActive !== undefined) spotlight.isActive = Boolean(isActive);

    await spotlight.save();
    spotlight = await Spotlight.findById(spotlight._id).populate("product");

    res.json({
      success: true,
      message: "Đã cập nhật banner sản phẩm nổi bật thành công!",
      data: spotlight,
    });
  } catch (error) {
    next(error);
  }
};
