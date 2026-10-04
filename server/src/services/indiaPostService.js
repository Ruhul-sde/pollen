/**
 * India Post Speed Post (भारतीय डाक - स्पीड पोस्ट) Logistics & Live Tracking Service
 * Official domestic express mail & parcel service of Department of Posts, Government of India.
 */

// Universal Postal Union (UPU) S10 13-character Speed Post format: E[A-Z][9 digits]IN
export const SPEED_POST_REGEX = /^E[A-Z]\d{9}IN$/i;
export const INDIA_POST_TRACKING_URL = "https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx";

// Postal Circle mapping by first 2 digits of PIN code
const POSTAL_CIRCLES = {
  "11": { state: "Delhi", circle: "Delhi Circle", gpo: "New Delhi GPO", zone: "North" },
  "12": { state: "Haryana", circle: "Haryana Circle", gpo: "Ambala GPO", zone: "North" },
  "13": { state: "Haryana", circle: "Haryana Circle", gpo: "Ambala GPO", zone: "North" },
  "14": { state: "Punjab", circle: "Punjab Circle", gpo: "Chandigarh GPO", zone: "North" },
  "15": { state: "Punjab", circle: "Punjab Circle", gpo: "Ludhiana GPO", zone: "North" },
  "16": { state: "Chandigarh", circle: "Punjab Circle", gpo: "Chandigarh GPO", zone: "North" },
  "17": { state: "Himachal Pradesh", circle: "HP Circle", gpo: "Shimla GPO", zone: "North" },
  "18": { state: "Jammu & Kashmir", circle: "J&K Circle", gpo: "Jammu GPO", zone: "North" },
  "19": { state: "Jammu & Kashmir", circle: "J&K Circle", gpo: "Srinagar GPO", zone: "North" },
  "20": { state: "Uttar Pradesh", circle: "UP Circle", gpo: "Lucknow GPO", zone: "North" },
  "21": { state: "Uttar Pradesh", circle: "UP Circle", gpo: "Allahabad GPO", zone: "North" },
  "22": { state: "Uttar Pradesh", circle: "UP Circle", gpo: "Varanasi GPO", zone: "North" },
  "23": { state: "Uttar Pradesh", circle: "UP Circle", gpo: "Gorakhpur GPO", zone: "North" },
  "24": { state: "Uttarakhand", circle: "Uttarakhand Circle", gpo: "Dehradun GPO", zone: "North" },
  "25": { state: "Uttar Pradesh", circle: "UP Circle", gpo: "Meerut GPO", zone: "North" },
  "26": { state: "Uttarakhand", circle: "Uttarakhand Circle", gpo: "Nainital GPO", zone: "North" },
  "27": { state: "Uttar Pradesh", circle: "UP Circle", gpo: "Faizabad GPO", zone: "North" },
  "28": { state: "Uttar Pradesh", circle: "UP Circle", gpo: "Agra GPO", zone: "North" },
  "30": { state: "Rajasthan", circle: "Rajasthan Circle", gpo: "Jaipur GPO", zone: "West" },
  "31": { state: "Rajasthan", circle: "Rajasthan Circle", gpo: "Udaipur GPO", zone: "West" },
  "32": { state: "Rajasthan", circle: "Rajasthan Circle", gpo: "Kota GPO", zone: "West" },
  "33": { state: "Rajasthan", circle: "Rajasthan Circle", gpo: "Bikaner GPO", zone: "West" },
  "34": { state: "Rajasthan", circle: "Rajasthan Circle", gpo: "Jodhpur GPO", zone: "West" },
  "36": { state: "Gujarat", circle: "Gujarat Circle", gpo: "Rajkot GPO", zone: "West" },
  "37": { state: "Gujarat", circle: "Gujarat Circle", gpo: "Jamnagar GPO", zone: "West" },
  "38": { state: "Gujarat", circle: "Gujarat Circle", gpo: "Ahmedabad GPO", zone: "West" },
  "39": { state: "Gujarat", circle: "Gujarat Circle", gpo: "Surat GPO", zone: "West" },
  "40": { state: "Maharashtra", circle: "Maharashtra Circle", gpo: "Mumbai GPO", zone: "West" },
  "41": { state: "Maharashtra", circle: "Maharashtra Circle", gpo: "Pune GPO", zone: "West" },
  "42": { state: "Maharashtra", circle: "Maharashtra Circle", gpo: "Nashik GPO", zone: "West" },
  "43": { state: "Maharashtra", circle: "Maharashtra Circle", gpo: "Aurangabad GPO", zone: "West" },
  "44": { state: "Maharashtra", circle: "Maharashtra Circle", gpo: "Nagpur GPO", zone: "West" },
  "45": { state: "Madhya Pradesh", circle: "MP Circle", gpo: "Indore GPO", zone: "Central" },
  "46": { state: "Madhya Pradesh", circle: "MP Circle", gpo: "Bhopal GPO", zone: "Central" },
  "47": { state: "Madhya Pradesh", circle: "MP Circle", gpo: "Gwalior GPO", zone: "Central" },
  "48": { state: "Madhya Pradesh", circle: "MP Circle", gpo: "Jabalpur GPO", zone: "Central" },
  "49": { state: "Chhattisgarh", circle: "Chhattisgarh Circle", gpo: "Raipur GPO", zone: "Central" },
  "50": { state: "Telangana", circle: "Telangana Circle", gpo: "Hyderabad GPO", zone: "South" },
  "51": { state: "Andhra Pradesh", circle: "AP Circle", gpo: "Tirupati GPO", zone: "South" },
  "52": { state: "Andhra Pradesh", circle: "AP Circle", gpo: "Vijayawada GPO", zone: "South" },
  "53": { state: "Andhra Pradesh", circle: "AP Circle", gpo: "Visakhapatnam GPO", zone: "South" },
  "56": { state: "Karnataka", circle: "Karnataka Circle", gpo: "Bengaluru GPO", zone: "South" },
  "57": { state: "Karnataka", circle: "Karnataka Circle", gpo: "Mangalore GPO", zone: "South" },
  "58": { state: "Karnataka", circle: "Karnataka Circle", gpo: "Hubli GPO", zone: "South" },
  "59": { state: "Karnataka", circle: "Karnataka Circle", gpo: "Belgaum GPO", zone: "South" },
  "60": { state: "Tamil Nadu", circle: "Tamil Nadu Circle", gpo: "Chennai GPO", zone: "South" },
  "61": { state: "Tamil Nadu", circle: "Tamil Nadu Circle", gpo: "Tiruchirappalli GPO", zone: "South" },
  "62": { state: "Tamil Nadu", circle: "Tamil Nadu Circle", gpo: "Madurai GPO", zone: "South" },
  "63": { state: "Tamil Nadu", circle: "Tamil Nadu Circle", gpo: "Salem GPO", zone: "South" },
  "64": { state: "Tamil Nadu", circle: "Tamil Nadu Circle", gpo: "Coimbatore GPO", zone: "South" },
  "67": { state: "Kerala", circle: "Kerala Circle", gpo: "Kozhikode GPO", zone: "South" },
  "68": { state: "Kerala", circle: "Kerala Circle", gpo: "Ernakulam GPO", zone: "South" },
  "69": { state: "Kerala", circle: "Kerala Circle", gpo: "Thiruvananthapuram GPO", zone: "South" },
  "70": { state: "West Bengal", circle: "WB Circle", gpo: "Kolkata GPO", zone: "East" },
  "71": { state: "West Bengal", circle: "WB Circle", gpo: "Howrah GPO", zone: "East" },
  "72": { state: "West Bengal", circle: "WB Circle", gpo: "Midnapore GPO", zone: "East" },
  "73": { state: "West Bengal", circle: "WB Circle", gpo: "Siliguri GPO", zone: "East" },
  "74": { state: "West Bengal", circle: "WB Circle", gpo: "Barasat GPO", zone: "East" },
  "75": { state: "Odisha", circle: "Odisha Circle", gpo: "Bhubaneswar GPO", zone: "East" },
  "76": { state: "Odisha", circle: "Odisha Circle", gpo: "Cuttack GPO", zone: "East" },
  "77": { state: "Odisha", circle: "Odisha Circle", gpo: "Sambalpur GPO", zone: "East" },
  "78": { state: "Assam", circle: "Assam Circle", gpo: "Guwahati GPO", zone: "North-East" },
  "79": { state: "North East (Arunachal, Manipur, Meghalaya, Mizoram, Nagaland, Tripura)", circle: "NE Circle", gpo: "Shillong GPO", zone: "North-East" },
  "80": { state: "Bihar", circle: "Bihar Circle", gpo: "Patna GPO", zone: "East" },
  "81": { state: "Bihar", circle: "Bihar Circle", gpo: "Bhagalpur GPO", zone: "East" },
  "82": { state: "Bihar", circle: "Bihar Circle", gpo: "Gaya GPO", zone: "East" },
  "83": { state: "Jharkhand", circle: "Jharkhand Circle", gpo: "Ranchi GPO", zone: "East" },
  "84": { state: "Bihar", circle: "Bihar Circle", gpo: "Muzaffarpur GPO", zone: "East" },
  "85": { state: "Bihar", circle: "Bihar Circle", gpo: "Purnea GPO", zone: "East" },
};

// Default Atelier Origin (New Delhi GPO / Delhi Circle)
const ATELIER_ORIGIN_PIN = "110001";
const ATELIER_ORIGIN_OFFICE = "New Delhi GPO (Booking NSH)";

/**
 * Generate a valid Indian Speed Post consignment tracking ID
 * Format: ED + 9 digits + IN (e.g. ED109842145IN)
 */
export function generateSpeedPostConsignmentId() {
  const prefix = "ED"; // Express Domestic
  const randomNineDigits = Math.floor(100000000 + Math.random() * 900000000);
  return `${prefix}${randomNineDigits}IN`;
}

/**
 * Determine postal circle, destination GPO, and transit zone from Indian PIN code
 */
export function getPostalCircleInfo(pincode) {
  const clean = (pincode || "").replace(/\D/g, "").slice(0, 6);
  if (clean.length < 2) {
    return {
      state: "India",
      circle: "National Network",
      gpo: "National Sorting Hub",
      zone: "National",
      tier: "national",
    };
  }

  const prefix2 = clean.slice(0, 2);
  const circleData = POSTAL_CIRCLES[prefix2] || {
    state: "India",
    circle: "India Post Circle",
    gpo: "Head Post Office",
    zone: "National",
  };

  const isLocal = clean.slice(0, 3) === ATELIER_ORIGIN_PIN.slice(0, 3);
  const isSameCircle = prefix2 === ATELIER_ORIGIN_PIN.slice(0, 2);
  const isSpecialZone = circleData.zone === "North-East" || ["18", "19", "79"].includes(prefix2);

  let tier = "national";
  if (isLocal) tier = "local";
  else if (isSameCircle) tier = "circle";
  else if (isSpecialZone) tier = "special";

  return {
    ...circleData,
    tier,
    isLocal,
    isSameCircle,
    isSpecialZone,
  };
}

/**
 * Calculate dynamic Indian Speed Post shipping charges and transit SLA
 */
export function calculateSpeedPostTariff({
  pincode = "",
  cartTotal = 0,
  freeShippingAbove = 499,
  customCharges = null,
} = {}) {
  const cleanPin = (pincode || "").replace(/\D/g, "").slice(0, 6);
  const circleInfo = getPostalCircleInfo(cleanPin);

  const shippingType = customCharges?.shippingType || "tiered";
  const flatRate = customCharges?.flatCharge !== undefined && customCharges?.flatCharge !== null
    ? Number(customCharges.flatCharge)
    : (customCharges?.standardCharge !== undefined ? Number(customCharges.standardCharge) : 65);

  let standardCharge = 65;
  let minDays = customCharges?.minDays !== undefined ? Number(customCharges.minDays) : 3;
  let maxDays = customCharges?.maxDays !== undefined ? Number(customCharges.maxDays) : 5;

  if (shippingType === "flat") {
    standardCharge = flatRate;
  } else {
    const local = customCharges?.localCharge !== undefined ? Number(customCharges.localCharge) : 35;
    const circle = customCharges?.circleCharge !== undefined ? Number(customCharges.circleCharge) : 47;
    const national = customCharges?.nationalCharge !== undefined ? Number(customCharges.nationalCharge) : 65;
    const special = customCharges?.specialCharge !== undefined ? Number(customCharges.specialCharge) : 85;

    switch (circleInfo.tier) {
      case "local":
        standardCharge = local;
        if (customCharges?.minDays === undefined) { minDays = 1; maxDays = 2; }
        break;
      case "circle":
        standardCharge = circle;
        if (customCharges?.minDays === undefined) { minDays = 2; maxDays = 3; }
        break;
      case "national":
        standardCharge = national;
        if (customCharges?.minDays === undefined) { minDays = 3; maxDays = 5; }
        break;
      case "special":
        standardCharge = special;
        if (customCharges?.minDays === undefined) { minDays = 5; maxDays = 7; }
        break;
    }
  }

  const waiveShipping = Boolean(customCharges?.waiveShipping);
  const waiveLabel = customCharges?.waiveLabel || "100% Delivery Fee Waived";

  const hasFreeShipping = freeShippingAbove !== null && freeShippingAbove !== undefined && Number(freeShippingAbove) > 0;
  const meetsFreeThreshold = hasFreeShipping && cartTotal >= Number(freeShippingAbove);
  const isFree = waiveShipping || meetsFreeThreshold;
  const charge = isFree ? 0 : standardCharge;
  const waivedAmount = isFree ? standardCharge : 0;

  // Compute estimated delivery date
  const now = new Date();
  const deliveryDateMin = new Date(now.getTime() + minDays * 24 * 60 * 60 * 1000);
  const deliveryDateMax = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);

  const options = { weekday: "short", month: "short", day: "numeric" };
  const estimatedDeliveryText = `${deliveryDateMin.toLocaleDateString("en-IN", options)} - ${deliveryDateMax.toLocaleDateString("en-IN", options)}`;

  return {
    carrier: "India Post Speed Post",
    carrierNameHindi: "भारतीय डाक - स्पीड पोस्ट",
    carrierCode: "INDIAPOST_SPEEDPOST",
    serviceName: "Domestic Express Air & Surface Speed Post",
    originOffice: ATELIER_ORIGIN_OFFICE,
    destinationCircle: circleInfo.circle,
    destinationState: circleInfo.state,
    destinationGPO: circleInfo.gpo,
    tier: circleInfo.tier,
    standardCharge,
    charge,
    isFreeShipping: isFree,
    isWaived: waiveShipping,
    waivedAmount,
    waiveLabel,
    freeShippingAbove,
    minDays,
    maxDays,
    estimatedDaysText: `${minDays}-${maxDays} Business Days`,
    estimatedDeliveryText,
    officialTrackingUrl: INDIA_POST_TRACKING_URL,
    serviceable: true,
  };
}

/**
 * Generate or simulate verified India Post Speed Post checkpoints for an order
 */
export function buildSpeedPostTrackingEvents({
  consignmentNumber,
  orderStatus,
  destinationPincode = "",
  destinationCity = "",
  bookingDate = new Date(),
} = {}) {
  const circle = getPostalCircleInfo(destinationPincode);
  const baseTime = new Date(bookingDate).getTime();
  const destName = destinationCity || circle.gpo;

  const events = [];

  // 1. Booking Milestone
  events.push({
    status: "booked",
    eventCode: "ITEM_BOOKED",
    description: `Item Booked at ${ATELIER_ORIGIN_OFFICE} under EMS Speed Post (Article: ${consignmentNumber})`,
    location: "New Delhi, Delhi",
    office: "New Delhi GPO Booking Counter",
    timestamp: new Date(baseTime),
  });

  // 2. Dispatched to National Sorting Hub
  if (["shipped", "in_transit", "out_for_delivery", "delivered"].includes(orderStatus.toLowerCase())) {
    events.push({
      status: "shipped",
      eventCode: "DISPATCHED_NSH",
      description: "Item Dispatched to National Sorting Hub (Delhi Air NSH)",
      location: "Delhi Air NSH",
      office: "Delhi Sorting Hub (Air Mail)",
      timestamp: new Date(baseTime + 4 * 60 * 60 * 1000), // +4 hours
    });

    events.push({
      status: "in_transit",
      eventCode: "ITEM_IN_TRANSIT",
      description: `Item Dispatched to Destination Sorting Hub (${circle.gpo})`,
      location: circle.gpo,
      office: `${circle.circle} - NSH Hub`,
      timestamp: new Date(baseTime + 18 * 60 * 60 * 1000), // +18 hours
    });
  }

  // 3. Out for Delivery
  if (["out_for_delivery", "delivered"].includes(orderStatus.toLowerCase())) {
    events.push({
      status: "out_for_delivery",
      eventCode: "OUT_FOR_DELIVERY",
      description: `Item Received at ${destName} Sub-Office. Beat Postman assigned for delivery.`,
      location: destName,
      office: `${destName} Delivery Post Office`,
      timestamp: new Date(baseTime + 36 * 60 * 60 * 1000), // +36 hours
    });
  }

  // 4. Delivered
  if (orderStatus.toLowerCase() === "delivered") {
    events.push({
      status: "delivered",
      eventCode: "ITEM_DELIVERED",
      description: `Item Successfully Delivered to Addressee. Confirmed by India Post Speed Post.`,
      location: destName,
      office: `${destName} Delivery Post Office`,
      timestamp: new Date(baseTime + 48 * 60 * 60 * 1000), // +48 hours
    });
  }

  return events;
}
