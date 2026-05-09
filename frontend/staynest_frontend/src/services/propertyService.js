import api from "./api";

/*
====================================================
OWNER – PROPERTY CRUD
====================================================
*/

/**
 * Get all properties owned by the logged-in owner
 * GET /owner/properties/
 */
export const getOwnerProperties = async () => {
  const res = await api.get("/owner/properties/");
  return res.data;
};

/**
 * Create property (DRAFT)
 * POST /owner/properties/
 * NOTE:
 * - Used immediately after Step 1 of wizard
 * - sharing_options REQUIRED by backend
 */
export const createProperty = async (formData) => {
  const res = await api.post("/owner/properties/", formData,);
  return res.data;
};

/**
 * Update property (partial update)
 * PATCH /owner/properties/:id/
 */
export const updateProperty = async (propertyId, formData) => {
  const res = await api.patch(
    `/owner/properties/${propertyId}/`,
    formData
  );
  return res.data;
};

/**
 * Get single owner property
 * GET /owner/properties/:id/
 */
export const getOwnerProperty = async (propertyId) => {
  const res = await api.get(`/owner/properties/${propertyId}/`);
  return res.data;
};

/**
 * Submit property for admin review
 * POST /owner/properties/:id/submit/
 */
export const submitProperty = async (propertyId) => {
  const res = await api.post(`/owner/properties/${propertyId}/submit/`);
  return res.data;
};

/**
 * Toggle property ACTIVE / INACTIVE
 * POST /owner/properties/:id/toggle/
 */
export const togglePropertyStatus = async (propertyId) => {
  const res = await api.post(`/owner/properties/${propertyId}/toggle/`);
  return res.data;
};

/*
====================================================
OWNER – PROPERTY IMAGES
====================================================
*/

/**
 * Upload property images
 * POST /owner/properties/:id/images/
 */
export const uploadPropertyImages = async (propertyId, images) => {
  const formData = new FormData();
  images.forEach((img) => formData.append("images", img));

  const res = await api.post(
    `/owner/properties/${propertyId}/images/`,
    formData
  );
  return res.data;
};

/**
 * Delete property image
 * DELETE /owner/properties/:id/images/:image_id/
 */
export const deletePropertyImage = async (propertyId, imageId) => {
  const res = await api.delete(
    `/owner/properties/${propertyId}/images/${imageId}/`
  );
  return res.data;
};

/*
====================================================
OWNER – PROPERTY LOCATION
====================================================
*/

/**
 * Update property location (map-based)
 * PUT /owner/property/location/:id/
 */
export const updatePropertyLocation = async (propertyId, locationData) => {
  const res = await api.patch(
    `/owner/property/location/${propertyId}/`,
    locationData
  );
  return res.data;
};

/*
====================================================
PUBLIC – USER SIDE (READ ONLY)
====================================================
*/

/**
 * Get properties by city
 * GET /properties/by-city/?city=
 */
export const getPropertiesByCity = async (city) => {
  const res = await api.get(`/properties/by-city/?city=${city}`);
  return res.data;
};

/**
 * Get nearby properties
 * GET /properties/nearby/?lat=&lng=&radius=
 */
export const getNearbyProperties = async (lat, lng, radius = 3) => {
  const res = await api.get(
    `/properties/nearby/?lat=${lat}&lng=${lng}&radius=${radius}`
  );
  return res.data;
};

/**
 * Get property location detail (public)
 * GET /properties/location/:id/
 */
export const getPropertyLocationDetail = async (propertyId) => {
  const res = await api.get(`/properties/location/${propertyId}/`);
  return res.data;
};

export const deleteProperty = async (propertyId) => {
  const res = await api.delete(
    `/owner/properties/${propertyId}/delete/`
  );
  return res.data;
};



/*
====================================================
PUBLIC – ACTIVE PROPERTY LISTING (READ ONLY)
====================================================
*/

/**
 * Get single ACTIVE property (public)
 * GET /properties/:id/
 */
export const getPublicPropertyDetail = async (propertyId) => {
  const res = await api.get(`/properties/${propertyId}/`);
  return res.data;
};

/**
 * Get all ACTIVE properties (public) with optional filters
 * GET /properties/?search=...&city=...
 */
export const getPublicProperties = async (params = {}) => {
  const res = await api.get("/properties/", { params });
  return res.data;
};