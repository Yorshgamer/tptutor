import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new Schema({
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  name:  { type: String, required: true, trim: true, maxlength: 80 },
  role:  { type: String, enum: ['student','teacher','admin'], default: 'student' },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

userSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plain, rounds = 12) {
  return bcrypt.hash(plain, Number(process.env.BCRYPT_ROUNDS || rounds));
};

export const User = mongoose.model('User', userSchema);