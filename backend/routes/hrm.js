const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ==================== EMPLOYEES ====================

// Get all employees
router.get('/employees', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM employee_master WHERE is_active = true ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create employee
router.post('/employees', authenticateToken, async (req, res) => {
  try {
    const {
      first_name, last_name, work_email, phone, designation,
      date_of_joining, department_id, staff_unique_id
    } = req.body;

    const result = await db.query(
      `INSERT INTO employee_master (
        first_name, last_name, work_email, phone, designation,
        date_of_joining, department_id, staff_unique_id, hospital_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        first_name, last_name, work_email, phone, designation,
        date_of_joining, department_id, staff_unique_id, '00000000-0000-0000-0000-000000000000' // Default UUID
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== LEAVES ====================

// Get leave types
router.get('/leave-types', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM leave_types WHERE is_active = true');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leave types:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Apply for leave
router.post('/leaves/apply', authenticateToken, async (req, res) => {
  try {
    const { employee_id, leave_type_id, start_date, end_date, reason } = req.body;
    
    // Calculate total days (simplified)
    const start = new Date(start_date);
    const end = new Date(end_date);
    const total_days = (end - start) / (1000 * 60 * 60 * 24) + 1;

    const result = await db.query(
      `INSERT INTO leave_applications (
        employee_id, leave_type_id, start_date, end_date, total_days, reason
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [employee_id, leave_type_id, start_date, end_date, total_days, reason]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error applying for leave:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get my leaves
router.get('/leaves/my-leaves', authenticateToken, async (req, res) => {
  try {
    // Assuming req.user.email matches work_email in employee_master
    // First find employee_id
    const empResult = await db.query(
      'SELECT id FROM employee_master WHERE work_email = $1',
      [req.user.email]
    );

    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    const employeeId = empResult.rows[0].id;

    const result = await db.query(
      `SELECT l.*, lt.leave_name 
       FROM leave_applications l
       JOIN leave_types lt ON l.leave_type_id = lt.id
       WHERE l.employee_id = $1
       ORDER BY l.created_at DESC`,
      [employeeId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching my leaves:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
