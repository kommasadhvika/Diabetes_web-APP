import express from 'express';
import { getAppointments, createAppointment, updateAppointment, deleteAppointment } from '../controllers/appointmentController.js';
import { protect } from '../middleware/auth.js';
import { validateAppointment } from '../middleware/validator.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAppointments)
  .post(validateAppointment, createAppointment);

router.route('/:id')
  .put(updateAppointment)
  .delete(deleteAppointment);

export default router;
