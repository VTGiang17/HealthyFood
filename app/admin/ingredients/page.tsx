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
} from "antd";

import type { TableColumnsType } from "antd";

import { Eye, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";

import { get } from "@/libs/axios";
import { API_PATH } from "@/api/apiPath";

import ImageFileField from "@/components/admin/ImageFileField";

import {
  Ingredient,
  IngredientPayload,
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "@/api/admin/ingredient";

import { getErrorMessage, getId, getList, money } from "@/libs/adminHelpers";

interface Category {
  _id: string;
  name: string;
}

interface IngredientFormValues {
  name: string;
  description?: string;
  category_id: string;
  price_per_100g: number;
  min_grams: number;
  max_grams: number;
  step_grams: number;
  calories: number;
  is_active: boolean;
}

export default function IngredientsPage() {
  const { message } = App.useApp();

  const [form] = Form.useForm<IngredientFormValues>();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [detail, setDetail] = useState<Ingredient | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [ingredientRes, categoryRes] = await Promise.all([
        getIngredients(),
        get(API_PATH.CATEGORY.LIST),
      ]);

      setIngredients(getList<Ingredient>(ingredientRes.data, "ingredients"));

      setCategories(getList<Category>(categoryRes.data, "categories"));
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return ingredients.filter((ingredient) => {
      const categoryId = getId(ingredient.category_id);

      const categoryName =
        categories.find((category) => category._id === categoryId)?.name || "";

      const matchesSearch =
        ingredient.name.toLowerCase().includes(keyword) ||
        categoryName.toLowerCase().includes(keyword);

      const matchesCategory =
        categoryFilter === "all" || categoryId === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [ingredients, categories, search, categoryFilter]);

  const openCreate = () => {
    setEditing(null);
    setImageFile(null);
    form.resetFields();

    form.setFieldsValue({
      is_active: true,
      price_per_100g: 0,
      min_grams: 50,
      max_grams: 300,
      step_grams: 10,
      calories: 0,
    });

    setModalOpen(true);
  };

  const openEdit = (ingredient: Ingredient) => {
    setEditing(ingredient);
    setImageFile(null);
    form.resetFields();

    form.setFieldsValue({
      name: ingredient.name,
      description: ingredient.description || "",
      category_id: getId(ingredient.category_id),
      price_per_100g: ingredient.price_per_100g,
      min_grams: ingredient.min_grams,
      max_grams: ingredient.max_grams,
      step_grams: ingredient.step_grams,
      calories: ingredient.nutrition?.calories ?? 0,
      is_active: ingredient.is_active,
    });

    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (values.max_grams < values.min_grams) {
        message.error("Gram tối đa phải lớn hơn hoặc bằng gram tối thiểu");
        return;
      }

      setSaving(true);

      const payload: IngredientPayload = {
        name: values.name.trim(),
        description: values.description?.trim() || "",
        category_id: values.category_id,
        image_url: editing?.image_url || "",
        price_per_100g: values.price_per_100g,
        min_grams: values.min_grams,
        max_grams: values.max_grams,
        step_grams: values.step_grams,
        is_active: values.is_active ?? true,
        nutrition: {
          calories: values.calories,
          protein: editing?.nutrition?.protein ?? 0,
          carbs: editing?.nutrition?.carbs ?? 0,
          fat: editing?.nutrition?.fat ?? 0,
        },
      };

      if (editing) {
        await updateIngredient(editing._id, payload, imageFile);

        message.success("Cập nhật nguyên liệu thành công");
      } else {
        await createIngredient(payload, imageFile);

        message.success("Thêm nguyên liệu thành công");
      }

      setModalOpen(false);
      setEditing(null);
      setImageFile(null);
      form.resetFields();

      await fetchData();
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) return;

      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIngredient(id);
      message.success("Xóa nguyên liệu thành công");
      setDetail(null);
      await fetchData();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const columns: TableColumnsType<Ingredient> = [
    {
      title: "Nguyên liệu",
      dataIndex: "name",
      render: (name: string, record) => (
        <div className="flex items-center gap-3">
          {record.image_url ? (
            <img
              src={record.image_url}
              alt={name}
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-gray-100" />
          )}

          <span className="font-semibold text-[#1d3829]">{name}</span>
        </div>
      ),
    },
    {
      title: "Danh mục",
      render: (_, record) =>
        categories.find(
          (category) => category._id === getId(record.category_id)
        )?.name || "—",
    },
    {
      title: "Giá / 100g",
      dataIndex: "price_per_100g",
      render: (price: number) => money(price),
    },
    {
      title: "Kcal / 100g",
      render: (_, record) => record.nutrition?.calories ?? 0,
    },
    {
      title: "Khẩu phần",
      render: (_, record) => `${record.min_grams}–${record.max_grams}g`,
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      render: (active: boolean) => (
        <Tag color={active ? "green" : "default"}>
          {active ? "Đang bán" : "Ngừng bán"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      fixed: "right",
      width: 165,
      render: (_, record) => (
        <Space size={3}>
          <Button
            type="text"
            icon={<Eye size={17} />}
            onClick={() => setDetail(record)}
          />
          <Button
            type="text"
            icon={<Pencil size={17} />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="Xóa nguyên liệu?"
            description={`Bạn muốn xóa "${record.name}"?`}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record._id)}
          >
            <Button type="text" danger icon={<Trash2 size={17} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1d3829]">
            Quản lý nguyên liệu
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Quản lý giá, định lượng, dinh dưỡng và hình ảnh
          </p>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<Plus size={17} />}
          onClick={openCreate}
        >
          Thêm nguyên liệu
        </Button>
      </div>

      <Card className="!rounded-2xl !border-gray-100">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Tìm kiếm nguyên liệu */}
            <Input
              allowClear
              size="large"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm nguyên liệu..."
              prefix={<Search size={17} />}
              className="!w-full sm:!w-[300px]"
            />

            {/* Lọc theo danh mục */}
            <Select
              size="large"
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="Chọn danh mục"
              className="!w-full sm:!w-[220px]"
              showSearch
              optionFilterProp="label"
              options={[
                {
                  value: "all",
                  label: "Tất cả danh mục",
                },
                ...categories.map((category) => ({
                  value: category._id,
                  label: category.name,
                })),
              ]}
            />
          </div>

          <Button
            icon={<RefreshCw size={16} />}
            loading={loading}
            onClick={fetchData}
          >
            Làm mới
          </Button>
        </div>

        <Table<Ingredient>
          rowKey="_id"
          columns={columns}
          dataSource={filtered}
          loading={loading}
          scroll={{ x: 1050 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
        />
      </Card>

      <Modal
        title={editing ? "Chỉnh sửa nguyên liệu" : "Thêm nguyên liệu"}
        open={modalOpen}
        onCancel={() => {
          if (!saving) setModalOpen(false);
        }}
        onOk={handleSave}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={saving}
        closable={!saving}
        maskClosable={!saving}
        width={780}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="!mt-6"
        >
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item
              name="name"
              label="Tên nguyên liệu"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: "Nhập tên nguyên liệu",
                },
              ]}
            >
              <Input size="large" />
            </Form.Item>

            <Form.Item
              name="category_id"
              label="Danh mục"
              rules={[
                {
                  required: true,
                  message: "Chọn danh mục",
                },
              ]}
            >
              <Select
                size="large"
                showSearch
                optionFilterProp="label"
                options={categories.map((category) => ({
                  value: category._id,
                  label: category.name,
                }))}
              />
            </Form.Item>
          </div>

          <Form.Item label="Hình ảnh">
            <ImageFileField
              imageUrl={editing?.image_url}
              file={imageFile}
              onChange={setImageFile}
            />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>

          <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-4">
            {[
              { name: "price_per_100g", label: "Giá / 100g (đ)" },
              { name: "min_grams", label: "Gram tối thiểu" },
              { name: "max_grams", label: "Gram tối đa" },
              { name: "step_grams", label: "Bước tăng (g)" },
            ].map((field) => (
              <Form.Item
                key={field.name}
                name={field.name}
                label={field.label}
                rules={[
                  {
                    required: true,
                    message: "Bắt buộc",
                  },
                ]}
              >
                <InputNumber
                  min={field.name === "step_grams" ? 1 : 0}
                  className="!w-full"
                />
              </Form.Item>
            ))}
          </div>

          <h3 className="mb-4 font-bold text-[#1d3829]">Calories / 100g</h3>

          <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-4">
            <Form.Item
              name="calories"
              label="Calories (kcal)"
              rules={[
                {
                  required: true,
                  message: "Bắt buộc",
                },
              ]}
            >
              <InputNumber min={0} className="!w-full" />
            </Form.Item>
          </div>

          <Form.Item
            label="Đang kinh doanh"
            name="is_active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="Chi tiết nguyên liệu"
        open={!!detail}
        width={520}
        onClose={() => setDetail(null)}
        extra={
          detail && (
            <Button
              type="primary"
              onClick={() => {
                const item = detail;
                setDetail(null);
                openEdit(item);
              }}
            >
              Chỉnh sửa
            </Button>
          )
        }
      >
        {detail && (
          <div className="space-y-5">
            {detail.image_url && (
              <img
                src={detail.image_url}
                alt={detail.name}
                className="h-56 w-full rounded-xl object-cover"
              />
            )}

            <h2 className="text-xl font-bold">{detail.name}</h2>

            <p className="text-gray-500">
              {detail.description || "Chưa có mô tả"}
            </p>

            <Descriptions
              bordered
              column={1}
              size="small"
              items={[
                {
                  key: "category",
                  label: "Danh mục",
                  children:
                    categories.find((c) => c._id === getId(detail.category_id))
                      ?.name || "—",
                },
                {
                  key: "price",
                  label: "Giá / 100g",
                  children: money(detail.price_per_100g),
                },
                {
                  key: "grams",
                  label: "Khẩu phần",
                  children: `${detail.min_grams}–${detail.max_grams}g`,
                },
                {
                  key: "step",
                  label: "Bước tăng",
                  children: `${detail.step_grams}g`,
                },
                {
                  key: "calories",
                  label: "Calories",
                  children: `${detail.nutrition?.calories ?? 0} kcal`,
                },
                {
                  key: "status",
                  label: "Trạng thái",
                  children: detail.is_active
                    ? "Đang kinh doanh"
                    : "Ngừng kinh doanh",
                },
              ]}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}
