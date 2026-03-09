const { HTTP_STATUS } = require("@/shared/config/constant.config");
const { ApiError } = require("@/shared/utils/apiError.utils");
const contactModel = require("@/modules/contact/contact.model");

class ContactService {
  // CREATE
  createContact = async (data) => {
    const contact = await contactModel.create(data);
    if (!contact) {
      throw new ApiError("Contact not created", HTTP_STATUS.BAD_REQUEST);
    }
    return contact;
  };

  // GET ALL
  getAllContacts = async (query) => {
    const contacts = await contactModel
      .find(query)
      .sort({ createdAt: -1 })
      .lean();
    return contacts;
  };

  // UPDATE
  updateContact = async (id, data) => {
    const contact = await contactModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );
    if (!contact) {
      throw new ApiError("Contact not found", HTTP_STATUS.NOT_FOUND);
    }
    return contact;
  };

  // DELETE
  deleteContact = async (id) => {
    const contact = await contactModel.findByIdAndDelete(id);
    if (!contact) {
      throw new ApiError("Contact not found", HTTP_STATUS.NOT_FOUND);
    }
    return contact;
  };
}

module.exports = new ContactService();
