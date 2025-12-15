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

// ==================== RBAC - ROLES & PERMISSIONS ====================

// Get all roles
router.get('/roles', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM roles ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching roles:', error);
    // Return empty array if table doesn't exist
    if (error.code === '42P01') {
      return res.json([]);
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all permissions
router.get('/permissions', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM permissions ORDER BY module, code');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    if (error.code === '42P01') {
      return res.json([]);
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Get permissions for a specific role
router.get('/role-permissions/:roleId', authenticateToken, async (req, res) => {
  try {
    const { roleId } = req.params;
    const result = await db.query(
      'SELECT permission_id FROM role_permissions WHERE role_id = $1',
      [roleId]
    );
    res.json(result.rows.map(r => r.permission_id));
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    if (error.code === '42P01') {
      return res.json([]);
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update permissions for a role
router.put('/role-permissions/:roleId', authenticateToken, async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body;

    // Delete existing permissions
    await db.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

    // Insert new permissions
    if (permissionIds && permissionIds.length > 0) {
      const values = permissionIds.map((pid, idx) => `($1, $${idx + 2})`).join(', ');
      await db.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`,
        [roleId, ...permissionIds]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user permissions by userId or email
router.get('/user-permissions', authenticateToken, async (req, res) => {
  try {
    const { userId, email } = req.query;
    let roleId = null;

    // Try to find employee by email first
    if (email) {
      const empByEmail = await db.query(
        'SELECT role_id FROM employee_master WHERE work_email = $1',
        [email]
      );
      if (empByEmail.rows.length > 0) {
        roleId = empByEmail.rows[0].role_id;
      }
    }

    // Try by ID if email didn't work
    if (!roleId && userId) {
      const empById = await db.query(
        'SELECT role_id FROM employee_master WHERE id = $1',
        [userId]
      );
      if (empById.rows.length > 0) {
        roleId = empById.rows[0].role_id;
      }
    }

    if (!roleId) {
      return res.json([]);
    }

    // Get permissions for the role
    const result = await db.query(
      `SELECT p.code FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = $1`,
      [roleId]
    );

    res.json(result.rows.map(r => r.code));
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.json([]);
  }
});

module.exports = router;

