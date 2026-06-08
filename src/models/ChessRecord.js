// ChessRecord.js - 井字棋战绩统计模型
// 记录用户井字棋游戏的战绩数据，包括：
// 1. 用户基本信息
// 2. 游戏场次统计（总场次、胜、负、平局）
// 3. 胜率计算
// 4. 最近游戏记录
// 5. 连续胜利记录
// A: 逻辑分组清晰，相关数据组织在一起，便于维护
// A: 虚拟字段是计算属性（getter），实例方法是可执行的操作
// A: 控制文档大小，避免无限增长，保留最近记录即可

const mongoose = require('mongoose');

// 定义井字棋战绩 Schema
const chessRecordSchema = new mongoose.Schema({
    // 用户ID（唯一索引，每个用户一条记录）
    userId: {
        type: String,
        required: [true, '用户ID不能为空'],
        unique: true,
        trim: true
    },

    // 统计信息（嵌套对象）
    stats: {
        // 总游戏场次
        totalGames: {
            type: Number,
            default: 0,
            min: 0
        },

        // 胜利场次
        wins: {
            type: Number,
            default: 0,
            min: 0
        },

        // 失败场次
        losses: {
            type: Number,
            default: 0,
            min: 0
        },

        // 平局场次
        draws: {
            type: Number,
            default: 0,
            min: 0
        },

        // 当前连胜场次
        winStreak: {
            type: Number,
            default: 0,
            min: 0
        },

        // 历史最高连胜场次
        maxWinStreak: {
            type: Number,
            default: 0,
            min: 0
        }
    },

    // 最近游戏记录（数组，最多保留10条）
    recentGames: [{
        // 房间ID
        roomId: {
            type: String,
            required: true
        },

        // 对手ID
        opponentId: {
            type: String,
            required: true
        },

        // 游戏结果
        result: {
            type: String,
            enum: {
                values: ['win', 'lose', 'draw'],
                message: '结果只能是 win, lose 或 draw'
            },
            required: true
        },

        // 使用的棋子
        playedAs: {
            type: String,
            enum: {
                values: ['X', 'O'],
                message: '棋子只能是 X 或 O'
            },
            required: true
        },

        // 游戏总步数
        moves: {
            type: Number,
            default: 0,
            min: 0
        },

        // 游戏时间
        playedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    // 自动管理 createdAt 和 updatedAt
    timestamps: true
});

// 虚拟字段：胜率
// 胜率 = 胜利场次 / 总场次 * 100
// Q: 虚拟字段会存储到数据库吗？
// A: 不会，只在 toJSON/toObject 时可选择包含
chessRecordSchema.virtual('winRate').get(function() {
    if (this.stats.totalGames === 0) {
        return 0;
    }
    return ((this.stats.wins / this.stats.totalGames) * 100).toFixed(2);
});

// 实例方法：更新战绩
// 1. 总场次 +1
// 2. 根据结果更新胜/负/平
// 3. 更新连胜记录
// 4. 添加最近游戏记录
// 5. 限制最近记录数量
// 6. 保存到数据库
chessRecordSchema.methods.updateGameResult = async function(result, opponentId, roomId, playedAs, moves) {
    // 总场次 +1
    this.stats.totalGames += 1;

    // 根据结果更新对应字段
    switch (result) {
        case 'win':
            this.stats.wins += 1;
            this.stats.winStreak += 1;
            
            // 更新最高连胜
            if (this.stats.winStreak > this.stats.maxWinStreak) {
                this.stats.maxWinStreak = this.stats.winStreak;
            }
            break;

        case 'lose':
            this.stats.losses += 1;
            this.stats.winStreak = 0; // 重置连胜
            break;

        case 'draw':
            this.stats.draws += 1;
            // 平局不重置连胜，也不增加
            break;

        default:
            throw new Error('无效的游戏结果');
    }

    // 添加最近游戏记录到数组开头
    this.recentGames.unshift({
        roomId,
        opponentId,
        result,
        playedAs,
        moves: moves || 0,
        playedAt: new Date()
    });

    // 限制最近记录最多10条
    if (this.recentGames.length > 10) {
        this.recentGames = this.recentGames.slice(0, 10);
    }

    // 保存到数据库
    await this.save();
};

// 静态方法：获取或创建用户战绩
// 1. 查找用户战绩记录
// 2. 如果不存在则创建新记录
// 3. 返回记录
chessRecordSchema.statics.getOrCreate = async function(userId) {
    let record = await this.findOne({ userId });
    
    if (!record) {
        record = new this({ userId });
        await record.save();
    }
    
    return record;
};

// 静态方法：获取排行榜
// 1. 胜率优先（虚拟字段无法直接排序，用 wins/totalGames）
// 2. 次选总场次
chessRecordSchema.statics.getLeaderboard = async function(limit = 10) {
    try {
        console.log('[ChessRecord] 查询排行榜, limit:', limit);
        
        const result = await this.find({ 'stats.totalGames': { $gt: 0 } })
            .sort({ 'stats.wins': -1, 'stats.totalGames': -1 })
            .limit(limit)
            .lean();
        
        console.log('[ChessRecord] 查询完成, 返回', result.length, '条记录');
        return result || [];
    } catch (error) {
        console.error('[ChessRecord] 查询排行榜失败:', error);
        // 返回空数组而不是抛出错误，让调用者处理
        return [];
    }
};

// 创建模型
const ChessRecord = mongoose.models.ChessRecord || mongoose.model('ChessRecord', chessRecordSchema);

// 导出模型
module.exports = ChessRecord;
