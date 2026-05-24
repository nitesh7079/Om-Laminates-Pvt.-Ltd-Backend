const Company = require('../models/Company');
const Group = require('../models/Group');

// @desc    Create company
// @route   POST /api/companies
// @access  Private (Admin)
exports.createCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);

    // Create default groups for the company
    const defaultGroups = Group.getDefaultGroups();
    const groupsToCreate = defaultGroups.map(group => ({
      ...group,
      company: company._id
    }));

    await Group.insertMany(groupsToCreate);

    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private
exports.getCompanies = async (req, res) => {
  try {
    let query = {};

    // If not admin, show only user's company
    if (req.user.role !== 'admin' && req.user.company) {
      query._id = req.user.company;
    }

    const companies = await Company.find(query).lean();
    
    // Support legacy company models seamlessly
    const formattedCompanies = companies.map(c => {
      if (!c.name && c.companyName) {
        c.name = c.companyName;
      }
      return c;
    });

    res.json({
      success: true,
      count: formattedCompanies.length,
      data: formattedCompanies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single company
// @route   GET /api/companies/:id
// @access  Private
exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).lean();

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    if (!company.name && company.companyName) {
      company.name = company.companyName;
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private (Admin)
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private (Admin)
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    await company.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
