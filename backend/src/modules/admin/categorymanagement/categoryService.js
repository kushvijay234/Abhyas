const CategoryModel = require("./categoryModel");

const getAllCategories = async () => {
  return await CategoryModel.getAll();
};

const createCategory = async (name) => {
  if (!name || !name.trim()) {
    throw new Error("Category name is required");
  }
  const cleanName = name.trim();
  const existing = await CategoryModel.findByName(cleanName);
  if (existing) {
    throw new Error("Category already exists");
  }
  const result = await CategoryModel.create(cleanName);
  return { id: result.insertId, name: cleanName };
};

const updateCategory = async (id, name) => {
  if (!id) throw new Error("Category ID is required");
  if (!name || !name.trim()) {
    throw new Error("Category name is required");
  }
  const cleanName = name.trim();
  
  const category = await CategoryModel.findById(id);
  if (!category) {
    throw new Error("Category not found");
  }

  const existing = await CategoryModel.findByName(cleanName);
  if (existing && String(existing.category_id) !== String(id)) {
    throw new Error("Another category with this name already exists");
  }

  await CategoryModel.update(id, cleanName);
  return { id, name: cleanName };
};

const deleteCategory = async (id) => {
  if (!id) throw new Error("Category ID is required");
  
  const category = await CategoryModel.findById(id);
  if (!category) {
    throw new Error("Category not found");
  }

  await CategoryModel.delete(id);
  return { message: "Category deleted successfully" };
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
