import mongoose from "mongoose";
import { Address } from "../models/Address.js";

/**
 * Get addresses by user ID
 */
export async function getAddresses(req, res, next) {
  try {
    const actualUserId = req.query.userId || req.user?.id;
    if (!actualUserId) {
      return res.json({ success: true, data: [] });
    }

    let userQuery = actualUserId;
    if (mongoose.isValidObjectId(actualUserId)) {
      userQuery = { $in: [actualUserId, new mongoose.Types.ObjectId(actualUserId)] };
    }

    const addresses = await Address.find({ userId: userQuery }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: addresses.map((addr) => ({
        id: addr._id.toString(),
        user_id: String(addr.userId),
        label: addr.label || "Home",
        full_name: addr.fullName || addr.name || "",
        phone: addr.phone || "",
        address_line1: addr.addressLine1 || addr.line1 || "",
        post_office: addr.postOffice || "",
        landmark: addr.landmark || "",
        city: addr.city || "",
        state: addr.state || "",
        postal_code: addr.postalCode || addr.pincode || "",
        country: addr.country || "India",
        created_at: addr.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new address for a user
 */
export async function createAddress(req, res, next) {
  try {
    const {
      userId,
      user_id,
      label,
      fullName,
      full_name,
      name,
      phone,
      addressLine1,
      address_line1,
      line1,
      postOffice,
      post_office,
      landmark,
      city,
      state,
      postalCode,
      postal_code,
      pincode,
      country,
    } = req.body;

    const actualUserId = userId || user_id || req.user?.id || ("guest_" + Date.now());
    const finalFullName = fullName || full_name || name || "";
    const finalLine1 = addressLine1 || address_line1 || line1 || "";
    const finalPostOffice = postOffice || post_office || "";
    const finalLandmark = landmark || "";
    const finalPostalCode = postalCode || postal_code || pincode || "";

    const address = await Address.create({
      userId: actualUserId,
      label: label || "Home",
      fullName: finalFullName,
      name: finalFullName,
      phone,
      addressLine1: finalLine1,
      line1: finalLine1,
      postOffice: finalPostOffice,
      landmark: finalLandmark,
      city,
      state,
      postalCode: finalPostalCode,
      pincode: finalPostalCode,
      country: country || "India",
    });

    res.status(201).json({
      success: true,
      data: {
        id: address._id.toString(),
        user_id: String(address.userId),
        label: address.label,
        full_name: address.fullName || address.name,
        phone: address.phone,
        address_line1: address.addressLine1 || address.line1,
        post_office: address.postOffice,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        postal_code: address.postalCode || address.pincode,
        country: address.country,
        created_at: address.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update saved address by ID
 */
export async function updateAddress(req, res, next) {
  try {
    const { id } = req.params;
    const {
      userId,
      user_id,
      label,
      fullName,
      full_name,
      name,
      phone,
      addressLine1,
      address_line1,
      line1,
      postOffice,
      post_office,
      landmark,
      city,
      state,
      postalCode,
      postal_code,
      pincode,
      country,
    } = req.body;

    const filter = { _id: id };
    const actualUserId = userId || user_id || req.user?.id;
    if (actualUserId) {
      if (mongoose.isValidObjectId(actualUserId)) {
        filter.userId = { $in: [actualUserId, new mongoose.Types.ObjectId(actualUserId)] };
      } else {
        filter.userId = actualUserId;
      }
    }

    const updateFields = {};
    if (label !== undefined) updateFields.label = label;
    const finalFullName = fullName ?? full_name ?? name;
    if (finalFullName !== undefined) {
      updateFields.fullName = finalFullName;
      updateFields.name = finalFullName;
    }
    if (phone !== undefined) updateFields.phone = phone;
    const finalLine1 = addressLine1 ?? address_line1 ?? line1;
    if (finalLine1 !== undefined) {
      updateFields.addressLine1 = finalLine1;
      updateFields.line1 = finalLine1;
    }
    const finalPostOffice = postOffice !== undefined ? postOffice : post_office;
    if (finalPostOffice !== undefined) updateFields.postOffice = finalPostOffice;
    if (landmark !== undefined) updateFields.landmark = landmark;
    if (city !== undefined) updateFields.city = city;
    if (state !== undefined) updateFields.state = state;
    const finalPostalCode = postalCode ?? postal_code ?? pincode;
    if (finalPostalCode !== undefined) {
      updateFields.postalCode = finalPostalCode;
      updateFields.pincode = finalPostalCode;
    }
    if (country !== undefined) updateFields.country = country;

    let updated = await Address.findOneAndUpdate(filter, { $set: updateFields }, { new: true });
    if (!updated && mongoose.isValidObjectId(id)) {
      updated = await Address.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    res.json({
      success: true,
      data: {
        id: updated._id.toString(),
        user_id: String(updated.userId),
        label: updated.label || "Home",
        full_name: updated.fullName || updated.name || "",
        phone: updated.phone || "",
        address_line1: updated.addressLine1 || updated.line1 || "",
        post_office: updated.postOffice || "",
        landmark: updated.landmark || "",
        city: updated.city || "",
        state: updated.state || "",
        postal_code: updated.postalCode || updated.pincode || "",
        country: updated.country || "India",
        created_at: updated.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete saved address by ID
 */
export async function deleteAddress(req, res, next) {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const filter = { _id: id };
    if (userId) {
      if (mongoose.isValidObjectId(userId)) {
        filter.userId = { $in: [userId, new mongoose.Types.ObjectId(userId)] };
      } else {
        filter.userId = userId;
      }
    }

    const deleted = await Address.findOneAndDelete(filter);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    res.json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    next(error);
  }
}


