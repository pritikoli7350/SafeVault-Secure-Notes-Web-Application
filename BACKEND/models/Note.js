const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    encryptionType: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
},

file: {
  type: String
},
originalFileName: {
  type: String
}

  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", NoteSchema);
