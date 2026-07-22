import express from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';
import { validateProfile } from '../middleware/validator.js';

const router = express.Router();

router.use(protect); // protect all profile endpoints

router.route('/')
  .get(getProfile)
  .post(validateProfile, updateProfile);

export default router;
