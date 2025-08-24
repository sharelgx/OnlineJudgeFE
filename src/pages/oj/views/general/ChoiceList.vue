<template>
  <div class="choice-list">
    <Panel shadow>
      <div slot="title">选择题列表</div>
      <div class="filter-row">
        <Input v-model="keyword" placeholder="搜索题目..." style="width: 300px; margin-right: 10px;" />
        <Select v-model="difficulty" placeholder="难度" style="width: 120px; margin-right: 10px;">
          <Option value="">全部</Option>
          <Option value="Low">简单</Option>
          <Option value="Mid">中等</Option>
          <Option value="High">困难</Option>
        </Select>
        <Button type="primary" @click="getChoiceList">搜索</Button>
      </div>
      <Table :columns="columns" :data="choiceList" :loading="loadingTable" style="width: 100%"></Table>
      <div v-if="!loadingTable && choiceList.length === 0" style="text-align: center; padding: 20px;">
        <p>暂无选择题</p>
      </div>
      
      <Pagination
        :total="total"
        :page-size="limit"
        @on-change="pushRouter"
        :current.sync="page"></Pagination>
    </Panel>
  </div>
</template>

<script>
import api from '@oj/api'
import { mapGetters } from 'vuex'
import Pagination from '@oj/components/Pagination'
import utils from '@/utils/utils'

export default {
  name: 'ChoiceList',
  components: {
    Pagination
  },
  data () {
    return {
      page: 1,
      limit: 20,
      total: 0,
      loadingTable: false,
      choiceList: [],
      keyword: '',
      difficulty: '',
      routeName: '',
      columns: [
        {
          title: 'ID',
          key: 'id',
          width: 80
        },
        {
          title: '题目',
          key: 'title',
          minWidth: 200,
          render: (h, params) => {
            return h('router-link', {
              props: {
                to: `/choice/${params.row.id}`
              },
              style: {
                color: '#2d8cf0'
              }
            }, params.row.title)
          }
        },
        {
          title: '难度',
          key: 'difficulty',
          width: 100,
          render: (h, params) => {
            let color = 'default'
            if (params.row.difficulty === 'Low') color = 'success'
            else if (params.row.difficulty === 'Mid') color = 'warning'
            else if (params.row.difficulty === 'High') color = 'error'
            return h('Tag', {
              props: {
                color: color
              }
            }, params.row.difficulty)
          }
        },
        {
          title: '分数',
          key: 'total_score',
          width: 80
        },
        {
          title: '提交数',
          key: 'submission_number',
          width: 100
        },
        {
          title: '通过数',
          key: 'accepted_number',
          width: 100
        },
        {
          title: '通过率',
          width: 100,
          render: (h, params) => {
            return h('span', this.getACRate(params.row.accepted_number, params.row.submission_number))
          }
        }
      ]
    }
  },
  mounted () {
    this.routeName = this.$route.name
    this.init()
  },
  methods: {
    init () {
      this.getChoiceList()
    },
    pushRouter () {
      this.$router.push({
        name: 'choice-list',
        query: utils.filterEmptyValue({
          keyword: this.keyword,
          difficulty: this.difficulty,
          page: this.page
        })
      })
    },
    getChoiceList () {
      let offset = (this.page - 1) * this.limit
      this.loadingTable = true
      let params = {
        limit: this.limit,
        offset: offset,
        keyword: this.keyword,
        difficulty: this.difficulty
      }
      api.getChoiceList(params).then(res => {
        this.loadingTable = false
        this.total = res.data.data.count || 0
        this.choiceList = res.data.data.results || []
      }, res => {
        this.loadingTable = false
      })
    },
    filterByKeyword () {
      this.page = 1
      this.pushRouter()
    },
    filterByDifficulty () {
      this.page = 1
      this.pushRouter()
    },
    goChoice (choiceId) {
      this.$router.push({ name: 'choice-details', params: { choiceId } })
    },
    getACRate (acNumber, totalNumber) {
      return !totalNumber ? '0.00%' : (acNumber / totalNumber * 100).toFixed(2) + '%'
    }
  },
  computed: {
    ...mapGetters(['profile', 'user'])
  },
  watch: {
    '$route' (newVal, oldVal) {
      if (newVal !== oldVal) {
        this.init()
      }
    }
  }
}
</script>

<style scoped>
.title {
  color: #495060;
  cursor: pointer;
}
.title:hover {
  color: #2d8cf0;
  border-bottom: 1px solid #2d8cf0;
}
</style>