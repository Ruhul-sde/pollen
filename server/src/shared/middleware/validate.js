import Joi from "joi";

/**
 * Middleware factory: validate req.body using a Joi schema.
 * Returns 422 with validation errors on failure.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      }));
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    req.body = value; // use stripped/coerced value
    next();
  };
}

/**
 * Middleware factory: validate req.query using a Joi schema.
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: false,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      }));
      return res.status(422).json({
        success: false,
        message: "Invalid query parameters",
        errors,
      });
    }

    req.query = value;
    next();
  };
}

// ── Shared Joi schemas ─────────────────────────────────────────────────────

export const schemas = {
  register: Joi.object({
    name: Joi.string().min(1).max(80).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required().messages({
      "any.required": "Mobile number is required",
      "string.empty": "Mobile number is required",
    }),
    password: Joi.string().min(6).max(100).required().messages({
      "any.required": "Password is required",
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters",
    }),
    referralCode: Joi.string().optional().allow(""),
  }).options({ allowUnknown: true }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  verifyOTP: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    password: Joi.string().min(6).max(100),
    newPassword: Joi.string().min(6).max(100),
  }).or("password", "newPassword"),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(80),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/),
  }),

  address: Joi.object({
    label: Joi.string().max(30).default("Home"),
    name: Joi.string().min(2).max(80).required(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    line1: Joi.string().min(5).max(200).required(),
    line2: Joi.string().max(200).optional().allow(""),
    city: Joi.string().min(2).max(80).required(),
    state: Joi.string().min(2).max(80).required(),
    pincode: Joi.string().length(6).required(),
    country: Joi.string().default("India"),
    isDefault: Joi.boolean().default(false),
  }),

  placeOrder: Joi.object({
    addressId: Joi.string().required(),
    paymentMethod: Joi.string().valid("razorpay", "cod", "wallet", "gift_card").required(),
    couponCode: Joi.string().optional().allow(""),
    giftCardCode: Joi.string().optional().allow(""),
    usePoints: Joi.boolean().default(false),
    notes: Joi.string().max(300).optional().allow(""),
  }),

  review: Joi.object({
    productId: Joi.string().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    title: Joi.string().max(100).optional().allow(""),
    body: Joi.string().max(1000).optional().allow(""),
  }),

  couponValidate: Joi.object({
    code: Joi.string().uppercase().required(),
    cartTotal: Joi.number().min(0).required(),
    productIds: Joi.array().items(Joi.string()).default([]),
  }),

  returnRequest: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          orderItemId: Joi.string().required(),
          qty: Joi.number().integer().min(1).required(),
          reason: Joi.string().max(300).optional(),
        })
      )
      .min(1)
      .required(),
    type: Joi.string().valid("refund", "return", "replace").required(),
    reason: Joi.string().min(10).max(500).required(),
  }),

  productQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    sort: Joi.string().valid("price_asc", "price_desc", "newest", "popular", "rating").default("newest"),
    category: Joi.string().optional(),
    brand: Joi.string().optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    search: Joi.string().optional(),
    inStock: Joi.boolean().optional(),
  }),
};
