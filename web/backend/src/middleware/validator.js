export const validateSignup = (req, res, next) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, password, and phone number' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }
  next();
};

export const validateProfile = (req, res, next) => {
  const { fullName, age, gender, height, weight, diabetesType, activityLevel } = req.body;
  if (!fullName || !age || !gender || !height || !weight || !diabetesType || !activityLevel) {
    return res.status(400).json({ success: false, message: 'Please fill in all profile details' });
  }
  if (isNaN(age) || age <= 0) {
    return res.status(400).json({ success: false, message: 'Please provide a valid age' });
  }
  if (isNaN(height) || height <= 0) {
    return res.status(400).json({ success: false, message: 'Please provide a valid height in cm' });
  }
  if (isNaN(weight) || weight <= 0) {
    return res.status(400).json({ success: false, message: 'Please provide a valid weight in kg' });
  }
  next();
};

export const validateSugar = (req, res, next) => {
  const { type, value } = req.body;
  if (!type || value === undefined) {
    return res.status(400).json({ success: false, message: 'Please provide sugar test type and glucose value' });
  }
  if (!['fasting', 'afterMeal', 'random'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Sugar test type must be fasting, afterMeal, or random' });
  }
  if (isNaN(value) || value <= 0) {
    return res.status(400).json({ success: false, message: 'Sugar level value must be a positive number' });
  }
  next();
};

export const validateAppointment = (req, res, next) => {
  const { doctorName, hospitalName, date, time } = req.body;
  if (!doctorName || !hospitalName || !date || !time) {
    return res.status(400).json({ success: false, message: 'Please provide doctor name, hospital, date, and time' });
  }
  next();
};
