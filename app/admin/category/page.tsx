"use client";

import { useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
} from "antd";

import type { TableColumnsType } from "antd";

import {
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";

import axios from "axios";

import {
  Category,
  CategoryPayload,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/api/admin/category";

export default function CategoriesPage() {
  const { message } = App.useApp();

  const [form] = Form.useForm<CategoryPayload>();

  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const getErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      return (
        error.response?.data?.message || "Có lỗi xảy ra khi kết nối máy chủ"
      );
    }

    return "Có lỗi xảy ra";
  };

  // Lấy danh sách danh mục
  const fetchCategories = async () => {
    try {
      setLoading(true);

      const response = await getCategories();

      setCategories(response.data.data);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCategories();
    // Tải danh sách khi mở trang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lọc danh mục theo tên hoặc mô tả
  const filteredCategories = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(keyword) ||
        (category.description ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [categories, search]);

  // Mở form thêm
  const handleOpenCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalOpen(true);
  };

  // Mở form sửa
  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description ?? "",
    });
    setModalOpen(true);
  };

  // Đóng modal
  const handleCloseModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  // Thêm hoặc cập nhật
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setSaving(true);

      const payload: CategoryPayload = {
        name: values.name.trim(),
        description: values.description?.trim() || "",
      };

      if (editingCategory) {
        await updateCategory(editingCategory._id, payload);

        message.success("Cập nhật danh mục thành công");
      } else {
        await createCategory(payload);

        message.success("Thêm danh mục thành công");
      }

      setModalOpen(false);
      setEditingCategory(null);
      form.resetFields();

      await fetchCategories();
    } catch (error) {
      // Validation Form không hợp lệ
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }

      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // Xóa danh mục theo ID
  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);

      message.success("Xóa danh mục thành công");

      await fetchCategories();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const columns: TableColumnsType<Category> = [
    {
      title: "STT",
      key: "index",
      width: 80,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Tên danh mục",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <span className="font-semibold text-[#1c4630]">{name}</span>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (description?: string) =>
        description || <span className="text-gray-400">Chưa có mô tả</span>,
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 140,
      render: () => <Tag color="green">Đang sử dụng</Tag>,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Space size={8}>
          <Button
            type="text"
            icon={<Pencil size={17} />}
            title="Chỉnh sửa"
            onClick={() => handleOpenEdit(record)}
          />

          <Popconfirm
            title="Xóa danh mục"
            description={`Bạn có chắc muốn xóa "${record.name}"?`}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{
              danger: true,
            }}
            onConfirm={() => handleDelete(record._id)}
          >
            <Button
              type="text"
              danger
              title="Xóa"
              icon={<Trash2 size={17} />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1c3325]">
            Quản lý danh mục
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Quản lý danh mục nguyên liệu và món ăn HealthyBowl
          </p>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<Plus size={18} />}
          onClick={handleOpenCreate}
        >
          Thêm danh mục
        </Button>
      </div>

      {/* CONTENT */}
      <Card className="!rounded-2xl !border-gray-100 !shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <Input
            size="large"
            placeholder="Tìm kiếm danh mục..."
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<Search size={17} className="text-gray-400" />}
            className="!max-w-[350px]"
          />

          <Button
            icon={<RefreshCw size={16} />}
            loading={loading}
            onClick={fetchCategories}
          >
            Làm mới
          </Button>
        </div>

        <Table<Category>
          rowKey="_id"
          loading={loading}
          columns={columns}
          dataSource={filteredCategories}
          scroll={{ x: 750 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} danh mục`,
          }}
          locale={{
            emptyText: (
              <div className="flex flex-col items-center gap-3 py-10">
                <FolderOpen size={36} className="text-gray-300" />
                <p className="text-gray-400">Chưa có danh mục</p>
              </div>
            ),
          }}
        />
      </Card>

      {/* MODAL */}
      <Modal
        title={editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
        open={modalOpen}
        onCancel={handleCloseModal}
        onOk={handleSubmit}
        okText={editingCategory ? "Lưu thay đổi" : "Thêm mới"}
        cancelText="Hủy"
        confirmLoading={saving}
        maskClosable={!saving}
        closable={!saving}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          className="!mt-6"
          requiredMark={false}
        >
          <Form.Item
            label="Tên danh mục"
            name="name"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập tên danh mục",
              },
              {
                max: 100,
                message: "Tên danh mục không quá 100 ký tự",
              },
            ]}
          >
            <Input size="large" placeholder="Nhập tên danh mục" />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea
              rows={4}
              placeholder="Nhập mô tả..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
