<template>
  <div class="view">
    <Panel title="标签管理">
      <div slot="header">
        <el-input v-model="keyword" prefix-icon="el-icon-search" placeholder="搜索标签名称"></el-input>
      </div>
      <el-table v-loading="loading" :data="list" style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column width="100" prop="id" label="ID"></el-table-column>
        <el-table-column prop="name" label="标签名称">
          <template slot-scope="{row}">
            <div v-show="!row.isEditing" class="title-cell clickable" @click="handleEdit(row)">{{ row.name }}</div>
            <el-input v-show="row.isEditing" v-model="row.name" placeholder="标签名称" @keyup.enter.native="handleInlineEdit(row)"></el-input>
          </template>
        </el-table-column>
        <el-table-column prop="color" label="颜色" width="120">
          <template slot-scope="scope">
            <el-tag :color="scope.row.color" size="small" :style="{backgroundColor: scope.row.color, color: '#fff'}">{{ scope.row.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip></el-table-column>
        <el-table-column prop="choice_count" label="题目数量" width="100">
          <template slot-scope="scope">
            <el-tag size="small">{{ scope.row.choice_count || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column width="200" prop="created_at" label="创建时间">
          <template slot-scope="scope">{{ scope.row.created_at | localtime }}</template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="200">
          <div slot-scope="scope">
            <icon-btn name="编辑" icon="edit" @click.native="handleEdit(scope.row)"></icon-btn>
            <icon-btn icon="trash" name="删除" @click.native="deleteItem(scope.row.id)"></icon-btn>
          </div>
        </el-table-column>
      </el-table>
      <div class="panel-options">
        <div class="left-buttons">
          <el-button type="primary" size="small" @click="handleCreate" icon="el-icon-plus">新建标签</el-button>
          <el-button type="danger" size="small" @click="batchDelete" :disabled="selectedItems.length === 0" icon="el-icon-delete">批量删除</el-button>
        </div>
        <el-pagination class="page" layout="prev, pager, next" @current-change="currentChange" :page-size="pageSize" :total="total"></el-pagination>
      </div>
    </Panel>

    <!-- 新建/编辑标签对话框 -->
    <el-dialog :title="dialogTitle" width="40%" :visible.sync="dialogVisible" @close="resetForm">
      <el-form :model="form" :rules="rules" ref="form" label-width="100px">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入标签名称"></el-input>
        </el-form-item>
        <el-form-item label="标签颜色" prop="color">
          <div style="display: flex; align-items: center;">
            <el-color-picker v-model="form.color" show-alpha></el-color-picker>
            <span style="margin-left: 10px;">预览：</span>
            <el-tag :color="form.color" size="small" :style="{backgroundColor: form.color, color: '#fff', marginLeft: '10px'}">{{ form.name || '标签预览' }}</el-tag>
          </div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="form.description" placeholder="请输入标签描述（可选）" :rows="3"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <cancel @click.native="dialogVisible = false"></cancel>
        <save @click.native="submitForm"></save>
      </span>
    </el-dialog>

    <!-- 行内编辑确认对话框 -->
    <el-dialog title="确认更新" width="20%" :visible.sync="inlineEditDialogVisible" @close-on-click-modal="false">
      <div>
        <p>标签名称：{{ currentRow.name }}</p>
      </div>
      <span slot="footer">
        <cancel @click.native="inlineEditDialogVisible = false; getList(currentPage)"></cancel>
        <save @click.native="updateItem(currentRow)"></save>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import api from '../../api'
import utils from '@/utils/utils'

export default {
  name: 'TagList',
  data () {
    return {
      pageSize: 10,
      total: 0,
      list: [],
      keyword: '',
      loading: false,
      currentPage: 1,
      selectedItems: [],
      dialogVisible: false,
      inlineEditDialogVisible: false,
      currentRow: {},
      isEdit: false,
      form: {
        name: '',
        color: '#409EFF',
        description: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入标签名称', trigger: 'blur' },
          { min: 1, max: 30, message: '长度在 1 到 30 个字符', trigger: 'blur' }
        ],
        color: [
          { required: true, message: '请选择标签颜色', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    dialogTitle () {
      return this.isEdit ? '编辑标签' : '新建标签'
    }
  },
  mounted () {
    this.getList(1)
  },
  methods: {
    // 获取标签列表
    getList (page) {
      this.loading = true
      this.currentPage = page
      let params = {
        limit: this.pageSize,
        offset: (page - 1) * this.pageSize
      }
      if (this.keyword) {
        params.keyword = this.keyword
      }
      api.getTagList(params).then(res => {
        this.loading = false
        this.total = res.data.data.total
        this.list = res.data.data.results
      }, res => {
        this.loading = false
      })
    },
    // 处理创建
    handleCreate () {
      this.isEdit = false
      this.form = {
        name: '',
        color: '#409EFF',
        description: ''
      }
      this.dialogVisible = true
    },
    // 处理编辑
    handleEdit (row) {
      this.isEdit = true
      this.form = {
        id: row.id,
        name: row.name,
        color: row.color || '#409EFF',
        description: row.description || ''
      }
      this.dialogVisible = true
    },
    // 提交表单
    submitForm () {
      this.$refs.form.validate((valid) => {
        if (valid) {
          if (this.isEdit) {
            this.updateTag()
          } else {
            this.createTag()
          }
        }
      })
    },
    // 创建标签
    createTag () {
      api.createTag(this.form).then(res => {
        this.$success('创建成功')
        this.dialogVisible = false
        this.getList(1)
      }).catch(() => {})
    },
    // 更新标签
    updateTag () {
      api.updateTag(this.form.id, this.form).then(res => {
        this.$success('更新成功')
        this.dialogVisible = false
        this.getList(this.currentPage)
      }).catch(() => {})
    },
    // 删除标签
    deleteItem (id) {
      this.$confirm('确定要删除这个标签吗？', '确认删除', {
        type: 'warning'
      }).then(() => {
        api.deleteTag(id).then(res => {
          this.$success('删除成功')
          this.getList(this.currentPage)
        }).catch(() => {})
      }).catch(() => {})
    },
    // 批量删除
    batchDelete () {
      this.$confirm(`确定要删除选中的 ${this.selectedItems.length} 个标签吗？`, '确认删除', {
        type: 'warning'
      }).then(() => {
        let ids = this.selectedItems.map(item => item.id)
        api.batchDeleteTag(ids).then(res => {
          this.$success('删除成功')
          this.getList(this.currentPage)
        }).catch(() => {})
      }).catch(() => {})
    },
    // 行内编辑
    handleInlineEdit (row) {
      this.currentRow = row
      this.inlineEditDialogVisible = true
    },
    // 更新项目
    updateItem (row) {
      api.updateTag(row.id, { name: row.name }).then(res => {
        this.$success('更新成功')
        this.inlineEditDialogVisible = false
        this.getList(this.currentPage)
      }).catch(() => {
        this.getList(this.currentPage)
      })
    },
    // 重置表单
    resetForm () {
      if (this.$refs.form) {
        this.$refs.form.resetFields()
      }
    },
    // 处理选择变化
    handleSelectionChange (val) {
      this.selectedItems = val
    },
    // 分页变化
    currentChange (page) {
      this.getList(page)
    }
  },
  watch: {
    keyword () {
      this.getList(1)
    }
  }
}
</script>

<style scoped>
.title-cell {
  cursor: pointer;
}
.title-cell:hover {
  color: #409EFF;
}
</style>