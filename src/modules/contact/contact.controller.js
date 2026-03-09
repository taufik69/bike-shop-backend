const ApiResponse = require("@/shared/utils/apiResponse.utils");
const asyncHandler = require("@/shared/utils/asyncHandeler.utils");
const { HTTP_STATUS } = require("@/shared/config/constant.config");
const contactService = require("@/modules/contact/contact.service");

class ContactController {
  // POST /contact/create
  createContact = asyncHandler(async (req, res) => {
    const data = req.validatedData;
    const contact = await contactService.createContact(data);
    return ApiResponse.success(
      res,
      HTTP_STATUS.CREATED,
      "Contact created successfully",
      contact,
    );
  });

  // GET /contact/all
  getAllContacts = asyncHandler(async (req, res) => {
    const contacts = await contactService.getAllContacts();
    return ApiResponse.success(
      res,
      HTTP_STATUS.OK,
      "Contacts fetched successfully",
      contacts,
    );
  });

  // GET /contact/:id
  getContactById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const contact = await contactService.getContactById(id);
    return ApiResponse.success(
      res,
      HTTP_STATUS.OK,
      "Contact fetched successfully",
      contact,
    );
  });

  // PATCH /contact/update/:id
  updateContact = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.validatedData;
    const contact = await contactService.updateContact(id, data);
    return ApiResponse.success(
      res,
      HTTP_STATUS.OK,
      "Contact updated successfully",
      contact,
    );
  });

  // DELETE /contact/delete/:id
  deleteContact = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const contact = await contactService.deleteContact(id);
    return ApiResponse.success(
      res,
      HTTP_STATUS.OK,
      "Contact deleted successfully",
      contact,
    );
  });
}

module.exports = new ContactController();
