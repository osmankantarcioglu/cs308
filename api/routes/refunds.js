const express = require("express");
const router = express.Router();
const Refund = require("../db/models/Refund");
const Enum = require("../config/Enum");
const { authenticate } = require("../lib/auth");
const { requireAdminOrProductManager } = require("../lib/middleware");
const { ValidationError, NotFoundError } = require("../lib/Error");
const { sendRefundStatusEmail } = require("../lib/refundEmail");

// PATCH /refunds/management/:id/status
router.patch(
  "/management/:id/status",
  authenticate,
  requireAdminOrProductManager,
  async (req, res, next) => {
    try {
      const { status, rejection_reason } = req.body;

      if (!status) {
        throw new ValidationError("Status is required");
      }

      const refund = await Refund.findById(req.params.id);
      if (!refund) {
        throw new NotFoundError("Refund not found");
      }

      let updatedRefund;

      if (status === Enum.REFUND_STATUS.APPROVED) {
        updatedRefund = await Refund.approveRefund(refund._id, req.user._id);
      } else if (status === Enum.REFUND_STATUS.REJECTED) {
        updatedRefund = await Refund.rejectRefund(
          refund._id,
          req.user._id,
          rejection_reason || "Not specified"
        );
      } else if (status === Enum.REFUND_STATUS.PROCESSED) {
        updatedRefund = await Refund.processRefund(refund._id);
      } else {
        throw new ValidationError("Invalid refund status");
      }

      try {
        await sendRefundStatusEmail(updatedRefund._id);
      } catch (e) {
        console.error("Error sending refund status email:", e);
      }

      res.json({
        success: true,
        message: "Refund status updated successfully",
        data: updatedRefund,
      });
    } catch (error) {
      if (error.name === "CastError") {
        next(new NotFoundError("Invalid refund ID"));
      } else {
        next(error);
      }
    }
  }
);

module.exports = router;
