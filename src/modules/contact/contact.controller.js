const ApiResponse = require("@/shared/utils/apiResponse.utils");
const asyncHandler = require("@/shared/utils/asyncHandeler.utils");
const { HTTP_STATUS } = require("@/shared/config/constant.config");
const contactService = require("@/modules/contact/contact.service");
const { ApiError } = require("@/shared/utils/apiError.utils");
const {
  getCache,
  setCache,
  buildCacheKey,
  bumpNsVersion,
  deleteCache,
} = require("@/shared/utils/cache.util");

// Namespace used for all contact caches
const NS = "contacts";

class ContactController {
  // POST /contacts/create-contact
  createContact = asyncHandler(async (req, res) => {
    const data = req.validatedData;
    const contact = await contactService.createContact(data);

    // Invalidate all contacts list caches
    await bumpNsVersion(NS);

    return ApiResponse.success(
      res,
      HTTP_STATUS.CREATED,
      "Contact created successfully",
      contact,
    );
  });

  // GET /contacts/get-contacts
  getAllContacts = asyncHandler(async (req, res) => {
    let q = {};
    const idFilter = req.query.id ? String(req.query.id).trim() : "";

    if (idFilter) {
      q._id = idFilter;
    }

    // Build a stable cache key based on the query
    const suffix = `id=${idFilter}`;
    const cacheKey = await buildCacheKey(NS, suffix);

    // Try cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Contacts fetched successfully (cache)",
        cached,
      );
    }

    // DB fetch
    const contacts = await contactService.getAllContacts(q);
    if (contacts.length === 0) {
      ApiResponse.success(res, HTTP_STATUS.OK, "No contacts found", contacts);
    }

    // Store in cache for 60 seconds
    await setCache(cacheKey, contacts, 60);

    return ApiResponse.success(
      res,
      HTTP_STATUS.OK,
      "Contacts fetched successfully",
      contacts,
    );
  });

  // GET /contacts/:id  (kept for direct single-doc lookup)
  getContactById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Per-document cache key
    const cacheKey = `contact:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Contact fetched successfully (cache)",
        cached,
      );
    }

    const contact = await contactService.getContactById(id);

    // Cache single doc for 120 seconds
    await setCache(cacheKey, contact, 120);

    return ApiResponse.success(
      res,
      HTTP_STATUS.OK,
      "Contact fetched successfully",
      contact,
    );
  });

  // PUT /contacts/update-contact/:id
  updateContact = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.validatedData;
    const contact = await contactService.updateContact(id, data);

    // Invalidate list caches + this doc's individual cache
    await bumpNsVersion(NS);
    await deleteCache(`contact:${id}`);

    return ApiResponse.success(
      res,
      HTTP_STATUS.OK,
      "Contact updated successfully",
      contact,
    );
  });

  // DELETE /contacts/delete-contact/:id
  deleteContact = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const contact = await contactService.deleteContact(id);

    // Invalidate list caches + this doc's individual cache
    await bumpNsVersion(NS);
    await deleteCache(`contact:${id}`);

    return ApiResponse.success(
      res,
      HTTP_STATUS.OK,
      "Contact deleted successfully",
      contact,
    );
  });
}

module.exports = new ContactController();
