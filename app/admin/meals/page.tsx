"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  App,
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";

import type { TableColumnsType } from "antd";

import {
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";

import { get } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";

import ImageFileField from "@/components/admin/ImageFileField";
import MealNutritionPreview from "@/components/admin/MealNutritionPreview";

import {
  Meal,
  MealPayload,
  getMeals,
  createMeal,
  updateMeal,
  deleteMeal,
} from "@/api/admin/meal";

import type { Ingredient } from "@/api/admin/ingredient";

import { getErrorMessage, getId, getList, money } from "@/libs/adminHelpers";

interface MealFormValues {
  name: string;
  description?: string;
  ingredients: {
    ingredient_id: string;
    quantity: number;
  }[];
  calories?: number;
  is_active: boolean;
  is_recommended: boolean;
}

export default function MealsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<MealFormValues>();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Meal | null>(null);
  const [detail, setDetail] = useState<Meal | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);

  // =====================================================
  // 1. LẤY DANH SÁCH MÓN ĂN VÀ NGUYÊN LIỆU
  // =====================================================

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [mealRes, ingredientRes] = await Promise.all([
        getMeals(),
        get(API_PATH.INGREDIENT.LIST),
      ]);

      setMeals(getList<Meal>(mealRes.data, "meals"));

      setIngredients(getList<Ingredient>(ingredientRes.data, "ingredients"));
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // =====================================================
  // 2. TÌM KIẾM VÀ LỌC
  // =====================================================

  const filteredMeals = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return meals.filter((meal) => {
      const matchesSearch =
        meal.name.toLowerCase().includes(keyword) ||
        (meal.description || "").toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && meal.is_active) ||
        (statusFilter === "inactive" && !meal.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [meals, search, statusFilter]);

  const getIngredientName = (id: string) => {
    return (
      ingredients.find((item) => item._id === id)?.name ||
      "Nguyên liệu không tồn tại"
    );
  };

  const calculateMealTotals = (meal: Meal) => {
    let grams = 0;
    let price = 0;

    for (const item of meal.ingredients || []) {
      const id = getId(item.ingredient_id);

      const ingredient = ingredients.find((value) => value._id === id);

      const quantity = Number(item.quantity) || 0;

      grams += quantity;

      if (!ingredient) continue;

      price += (ingredient.price_per_100g * quantity) / 100;
    }

    return {
      grams,
      price: Math.round(price),
    };
  };

  const getMealCalories = (meal: Meal) =>
    meal.calories ?? meal.totals?.calories ?? 0;

  // =====================================================
  // 3. MỞ FORM THÊM MÓN ĂN
  // =====================================================

  const openCreate = () => {
    setEditing(null);
    setImageFile(null);

    form.resetFields();

    form.setFieldsValue({
      name: "",
      description: "",
      ingredients: [],
      is_active: true,
      is_recommended: false,
    });

    setModalOpen(true);
  };

  // =====================================================
  // 4. MỞ FORM CHỈNH SỬA
  // =====================================================

  const openEdit = (meal: Meal) => {
    setEditing(meal);
    setImageFile(null);

    form.resetFields();

    form.setFieldsValue({
      name: meal.name,
      description: meal.description || "",
      is_active: meal.is_active,
      is_recommended: meal.is_recommended,
      calories: meal.calories ?? undefined,

      ingredients: (meal.ingredients || []).map((item) => ({
        ingredient_id: getId(item.ingredient_id),
        quantity: item.quantity,
      })),
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditing(null);
    setImageFile(null);
    form.resetFields();
  };

  // =====================================================
  // 5. VALIDATE ĐỊNH LƯỢNG NGUYÊN LIỆU
  // =====================================================

  const validateIngredients = (
    items: MealFormValues["ingredients"]
  ): boolean => {
    if (!items?.length) {
      message.error("Món ăn phải có ít nhất một nguyên liệu");
      return false;
    }

    const selectedIds = items.map((item) => item.ingredient_id);

    if (new Set(selectedIds).size !== selectedIds.length) {
      message.error("Không được chọn trùng nguyên liệu trong một món");
      return false;
    }

    for (const item of items) {
      const ingredient = ingredients.find(
        (value) => value._id === item.ingredient_id
      );

      if (!ingredient) {
        message.error("Nguyên liệu không tồn tại");
        return false;
      }

      const quantity = Number(item.quantity);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        message.error(`Vui lòng nhập định lượng cho ${ingredient.name}`);
        return false;
      }

      if (quantity < ingredient.min_grams || quantity > ingredient.max_grams) {
        message.error(
          `${ingredient.name}: định lượng phải từ ` +
            `${ingredient.min_grams}g đến ${ingredient.max_grams}g`
        );
        return false;
      }

      if (
        ingredient.step_grams > 0 &&
        Math.abs(
          (quantity - ingredient.min_grams) / ingredient.step_grams -
            Math.round(
              (quantity - ingredient.min_grams) / ingredient.step_grams
            )
        ) > 0.000001
      ) {
        message.error(
          `${ingredient.name}: định lượng phải tăng ` +
            `theo bước ${ingredient.step_grams}g`
        );
        return false;
      }
    }

    return true;
  };

  // =====================================================
  // 6. THÊM / CẬP NHẬT MÓN ĂN
  // =====================================================

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (!validateIngredients(values.ingredients)) {
        return;
      }

      setSaving(true);

      const payload: MealPayload = {
        name: values.name.trim(),
        description: values.description?.trim() || "",
        image_url: editing?.image_url || "",
        is_active: values.is_active ?? true,
        is_recommended: values.is_recommended ?? false,
        calories: values.calories ?? null,

        ingredients: values.ingredients.map((item) => ({
          ingredient_id: item.ingredient_id,
          quantity: Number(item.quantity),
        })),
      };

      if (editing) {
        await updateMeal(editing._id, payload, imageFile);

        message.success("Cập nhật món ăn thành công");
      } else {
        await createMeal(payload, imageFile);

        message.success("Thêm món ăn thành công");
      }

      setModalOpen(false);
      setEditing(null);
      setImageFile(null);

      form.resetFields();

      await fetchData();
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }

      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // 7. XÓA MÓN ĂN
  // =====================================================

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);

      await deleteMeal(id);

      message.success("Xóa món ăn thành công");

      if (detail?._id === id) {
        setDetail(null);
      }

      await fetchData();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  // =====================================================
  // 8. CẤU HÌNH BẢNG
  // =====================================================

  const columns: TableColumnsType<Meal> = [
    {
      title: "Món ăn",
      dataIndex: "name",
      key: "name",
      width: 260,

      render: (name: string, record) => (
        <div className="flex items-center gap-3">
          {record.image_url ? (
            <img
              src={record.image_url}
              alt={name}
              className="h-14 w-14 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              <UtensilsCrossed size={22} />
            </div>
          )}

          <div>
            <p className="font-semibold text-[#1d3829]">{name}</p>

            {record.is_recommended && (
              <Tag color="gold" className="!mt-1">
                Nổi bật
              </Tag>
            )}
          </div>
        </div>
      ),
    },

    {
      title: "Nguyên liệu",
      key: "ingredients",
      align: "center",
      render: (_, record) => record.ingredients?.length || 0,
    },

    {
      title: "Khối lượng",
      key: "grams",
      render: (_, record) => `${calculateMealTotals(record).grams}g`,
    },

    {
      title: "Calories",
      key: "calories",
      render: (_, record) => {
        return (
          <span className="font-semibold text-orange-600">
            {getMealCalories(record)} kcal
          </span>
        );
      },
    },

    {
      title: "Giá nguyên liệu",
      key: "price",
      render: (_, record) => money(calculateMealTotals(record).price),
    },

    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "status",

      render: (active: boolean) => (
        <Tag color={active ? "green" : "default"}>
          {active ? "Đang bán" : "Ngừng bán"}
        </Tag>
      ),
    },

    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 160,

      render: (_, record) => (
        <Space size={3}>
          <Button
            type="text"
            title="Xem chi tiết"
            icon={<Eye size={17} />}
            onClick={() => setDetail(record)}
          />

          <Button
            type="text"
            title="Chỉnh sửa"
            icon={<Pencil size={17} />}
            onClick={() => openEdit(record)}
          />

          <Popconfirm
            title="Xóa món ăn?"
            description={`Bạn chắc chắn muốn xóa "${record.name}"?`}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{
              danger: true,
              loading: deletingId === record._id,
            }}
            onConfirm={() => handleDelete(record._id)}
          >
            <Button
              type="text"
              danger
              title="Xóa món ăn"
              icon={<Trash2 size={17} />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // =====================================================
  // 9. GIAO DIỆN
  // =====================================================

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1d3829]">
            Quản lý món ăn
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Quản lý thực đơn, nguyên liệu và dinh dưỡng của các món ăn
            HealthyBowl
          </p>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<Plus size={17} />}
          onClick={openCreate}
        >
          Thêm món ăn
        </Button>
      </div>

      {/* DANH SÁCH MÓN ĂN */}
      <Card className="!rounded-2xl !border-gray-100 !shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <Input
              size="large"
              allowClear
              placeholder="Tìm kiếm món ăn..."
              prefix={<Search size={17} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="!w-[300px]"
            />

            <Select
              size="large"
              value={statusFilter}
              onChange={setStatusFilter}
              className="!w-[170px]"
              options={[
                {
                  value: "all",
                  label: "Tất cả trạng thái",
                },
                {
                  value: "active",
                  label: "Đang bán",
                },
                {
                  value: "inactive",
                  label: "Ngừng bán",
                },
              ]}
            />
          </div>

          <Button
            icon={<RefreshCw size={16} />}
            onClick={fetchData}
            loading={loading}
          >
            Làm mới
          </Button>
        </div>

        <Table<Meal>
          rowKey="_id"
          dataSource={filteredMeals}
          columns={columns}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} món ăn`,
          }}
          locale={{
            emptyText: (
              <div className="py-8 text-center text-gray-400">
                Chưa có món ăn nào
              </div>
            ),
          }}
        />
      </Card>

      {/* MODAL THÊM / SỬA */}
      <Modal
        title={editing ? "Chỉnh sửa món ăn" : "Thêm món ăn mới"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        okText={editing ? "Lưu thay đổi" : "Thêm món ăn"}
        cancelText="Hủy"
        confirmLoading={saving}
        closable={!saving}
        maskClosable={!saving}
        width={850}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="!mt-6"
        >
          {/* TÊN MÓN */}
          <Form.Item
            name="name"
            label="Tên món ăn"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập tên món ăn",
              },
            ]}
          >
            <Input size="large" placeholder="Ví dụ: Thăn bò xào rau củ" />
          </Form.Item>

          {/* MÔ TẢ */}
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Nhập mô tả món ăn..." />
          </Form.Item>

          {/* HÌNH ẢNH */}
          <Form.Item label="Hình ảnh món ăn">
            <ImageFileField
              imageUrl={editing?.image_url}
              file={imageFile}
              onChange={setImageFile}
            />
          </Form.Item>

          {/* NGUYÊN LIỆU */}
          <div className="mb-4 mt-6">
            <h3 className="text-base font-bold text-[#1d3829]">
              Thành phần món ăn
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Chọn nguyên liệu và định lượng cho một khẩu phần tiêu chuẩn.
            </p>
          </div>

          <Form.List name="ingredients">
            {(fields, { add, remove }) => (
              <div className="space-y-3">
                {fields.map((field) => (
                  <div
                    key={field.key}
                    className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-[1fr_150px_42px]"
                  >
                    <Form.Item
                      name={[field.name, "ingredient_id"]}
                      label="Nguyên liệu"
                      className="!mb-0"
                      rules={[
                        {
                          required: true,
                          message: "Chọn nguyên liệu",
                        },
                      ]}
                    >
                      <Select
                        showSearch
                        size="large"
                        placeholder="Chọn nguyên liệu"
                        optionFilterProp="label"
                        options={ingredients.map((ingredient) => ({
                          value: ingredient._id,
                          label: ingredient.name,
                        }))}
                      />
                    </Form.Item>

                    <Form.Item
                      name={[field.name, "quantity"]}
                      label="Số gram"
                      className="!mb-0"
                      rules={[
                        {
                          required: true,
                          message: "Nhập số gram",
                        },
                        {
                          type: "number",
                          min: 1,
                          message: "Gram phải lớn hơn 0",
                        },
                      ]}
                    >
                      <InputNumber
                        min={1}
                        size="large"
                        addonAfter="g"
                        className="!w-full"
                      />
                    </Form.Item>

                    <div className="flex items-end pb-1">
                      <Button
                        danger
                        type="text"
                        title="Bỏ nguyên liệu"
                        icon={<Trash2 size={18} />}
                        onClick={() => remove(field.name)}
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="dashed"
                  block
                  size="large"
                  icon={<Plus size={17} />}
                  onClick={() =>
                    add({
                      ingredient_id: undefined,
                      quantity: 100,
                    })
                  }
                >
                  Thêm nguyên liệu
                </Button>
              </div>
            )}
          </Form.List>

          {/* CALORIES CHO MỘT KHẨU PHẦN */}
          <div className="mt-6 rounded-xl border border-green-100 bg-green-50/30 p-4">
            <h3 className="mb-2 font-bold text-[#1d3829]">
              Calories của món ăn
            </h3>

            <p className="mb-4 text-sm text-gray-500">
              Nhập tổng Calories cho một khẩu phần tiêu chuẩn. Nếu bỏ trống, hệ
              thống sẽ tự tính từ các nguyên liệu.
            </p>

            <Form.Item
              name="calories"
              label="Calories / khẩu phần (kcal)"
              rules={[
                {
                  type: "number",
                  min: 0,
                  message: "Calories không được âm",
                },
              ]}
            >
              <InputNumber
                min={0}
                precision={1}
                size="large"
                placeholder="Ví dụ: 450"
                addonAfter="kcal"
                className="!w-full sm:!w-[280px]"
              />
            </Form.Item>
          </div>

          {/* TỰ ĐỘNG TÍNH DINH DƯỠNG */}
          <MealNutritionPreview ingredients={ingredients} />

          {/* TRẠNG THÁI */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Form.Item
              name="is_recommended"
              label="Món ăn đề xuất"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="is_active"
              label="Đang kinh doanh"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* DRAWER CHI TIẾT */}
      <Drawer
        title="Chi tiết món ăn"
        width={560}
        open={!!detail}
        onClose={() => setDetail(null)}
        extra={
          detail && (
            <Button
              type="primary"
              onClick={() => {
                const current = detail;

                setDetail(null);
                openEdit(current);
              }}
            >
              Chỉnh sửa
            </Button>
          )
        }
      >
        {detail && (
          <div className="space-y-6">
            {detail.image_url ? (
              <img
                src={detail.image_url}
                alt={detail.name}
                className="h-56 w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-56 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                Chưa có hình ảnh
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-[#1d3829]">
                {detail.name}
              </h2>

              <Typography.Paragraph type="secondary" className="!mt-2">
                {detail.description || "Chưa có mô tả"}
              </Typography.Paragraph>
            </div>

            <Descriptions
              bordered
              column={1}
              size="small"
              items={[
                {
                  key: "grams",
                  label: "Tổng khối lượng",
                  children: `${calculateMealTotals(detail).grams}g`,
                },
                {
                  key: "calories",
                  label: "Calories",
                  children: `${getMealCalories(detail)} kcal`,
                },
                {
                  key: "price",
                  label: "Giá nguyên liệu",
                  children: money(calculateMealTotals(detail).price),
                },
                {
                  key: "recommended",
                  label: "Món ăn đề xuất",
                  children: detail.is_recommended ? "Có" : "Không",
                },
                {
                  key: "status",
                  label: "Trạng thái",
                  children: (
                    <Tag color={detail.is_active ? "green" : "default"}>
                      {detail.is_active ? "Đang bán" : "Ngừng bán"}
                    </Tag>
                  ),
                },
              ]}
            />

            <div>
              <h3 className="mb-3 font-bold text-[#1d3829]">
                Danh sách nguyên liệu
              </h3>

              <div className="divide-y rounded-xl border border-gray-100">
                {detail.ingredients?.map((item, index) => {
                  const id = getId(item.ingredient_id);

                  const ingredient = ingredients.find(
                    (value) => value._id === id
                  );

                  const calories = ingredient
                    ? (ingredient.nutrition.calories * item.quantity) / 100
                    : null;

                  return (
                    <div
                      key={`${id}-${index}`}
                      className="flex items-center justify-between gap-3 p-4"
                    >
                      <div>
                        <p className="font-semibold">{getIngredientName(id)}</p>

                        <p className="mt-1 text-xs text-gray-500">
                          {calories === null
                            ? "Chưa có dữ liệu dinh dưỡng"
                            : `${Math.round(calories * 10) / 10} kcal`}
                        </p>
                      </div>

                      <span className="font-bold">{item.quantity}g</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
