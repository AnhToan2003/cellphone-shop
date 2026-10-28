import { z } from "zod";

import { Banner } from "../models/Banner.js";
import { deleteUploadedImage, saveUploadedImage } from "../middleware/upload.js";

const DEFAULT_BANNER = {
  sentence: "Welcome to Cellphone Shop",
  description:
    "Discover premium smartphones, fast delivery, and flexible payment plans tailored to every flagship launch.",
  image:
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80",
  link: "",
};

const bannerBodySchema = z.object({
  title: z.string().optional().default(""),
  description: z.string().optional().default(""),
  link: z.string().optional().default(""),
});

const buildFeaturedBanner = (raw = {}) => ({
  sentence: raw?.title || DEFAULT_BANNER.sentence,
  description: raw?.description || DEFAULT_BANNER.description,
  image: raw?.imageUrl || raw?.image || DEFAULT_BANNER.image,
  link: raw?.link || DEFAULT_BANNER.link,
});

export const getBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    const featured = buildFeaturedBanner(banners?.[0]);

    res.json({
      success: true,
      data: banners,
      featured,
      sentence: featured.sentence,
      description: featured.description,
      image: featured.image,
      link: featured.link,
    });
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required",
      });
    }

    const parsed = bannerBodySchema.parse(req.body ?? {});

    const imageUrl = await saveUploadedImage(req.file, "banners");

    const banner = await Banner.create({
      imageUrl,
      title: parsed.title.trim(),
      description: parsed.description.trim(),
      link: parsed.link.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    await banner.deleteOne();
    await deleteUploadedImage(banner.imageUrl, "banners");

    res.json({
      success: true,
      message: "Banner removed",
    });
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    const parsed = bannerBodySchema.parse(req.body ?? {});

    const previousImageUrl = banner.imageUrl;
    let nextImageUrl = previousImageUrl;

    if (req.file) {
      nextImageUrl = await saveUploadedImage(req.file, "banners");
    }

    banner.title = parsed.title.trim();
    banner.description = parsed.description.trim();
    banner.link = parsed.link.trim();
    banner.imageUrl = nextImageUrl;

    await banner.save();

    if (req.file && previousImageUrl !== nextImageUrl) {
      await deleteUploadedImage(previousImageUrl, "banners");
    }

    res.json({
      success: true,
      message: "Banner updated successfully",
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};
