import mongoose from "mongoose";

const SupportKnowledgeSnapshotSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    refreshedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

SupportKnowledgeSnapshotSchema.index({ refreshedAt: -1 });

export const SupportKnowledgeSnapshot =
  mongoose.models.SupportKnowledgeSnapshot ||
  mongoose.model("SupportKnowledgeSnapshot", SupportKnowledgeSnapshotSchema);

export default SupportKnowledgeSnapshot;
