/**
 * 知识点讲解模板数据库
 * Story 3-2: generate-knowledge-point-explanation
 * Story 3-4: multiple-explanation-formats
 * 提供预审核的讲解内容作为AI生成失败时的降级方案
 */

import {
  Explanation,
  ExplanationSource,
  ExplanationSectionType,
  TeachingTip,
  ExplanationExample,
  ExplanationFormat,
} from '../types/explanation';
import {KnowledgePoint} from '../types/knowledgePoint';

/**
 * 模板讲解数据库
 * 为核心知识点提供预审核的高质量讲解内容
 */
export const TEMPLATE_EXPLANATIONS: Explanation[] = [
  // ========== 数的认识 (10以内) ==========
  {
    id: 'exp-template-nr-001',
    knowledgePointId: 'kp-nr-001',
    knowledgePointName: '10以内数的认识',
    sections: [
      {
        type: ExplanationSectionType.DEFINITION,
        title: '什么是10以内的数？',
        content: [
          '10以内的数就是0、1、2、3、4、5、6、7、8、9、10这些数字。',
          '这些数字就像楼梯的台阶，一个比一个高。',
          '我们可以用这些数字来数身边的东西，比如有几个苹果，有几个小朋友。',
        ],
        order: 1,
      },
      {
        type: ExplanationSectionType.METHODS,
        title: '怎么教孩子认识数字？',
        content: [
          '第一步：先数具体的东西。用孩子喜欢的玩具、水果来数，比如"1个苹果、2个苹果"。',
          '第二步：认识数字的形状。可以和孩子一起写数字，或者用手指比划数字的样子。',
          '第三步：找到生活中的数字。比如电梯按钮、钟表上的数字、公交车号码。',
          '第四步：玩数数游戏。上下楼梯时数台阶，吃饭时数碗筷。',
        ],
        order: 2,
      },
      {
        type: ExplanationSectionType.EXAMPLES,
        title: '常见的练习题目',
        content: [],
        examples: [
          {
            question: '数一数，下面有几个苹果？🍎🍎🍎',
            answer: '3个',
            steps: [
              '用手指指着苹果，一个一个地数',
              '数一个说一个数字：1、2、3',
              '数到最后一个数字就是答案：3个',
            ],
            difficulty: 'easy',
          },
          {
            question: '请写出数字5',
            answer: '5',
            steps: [
              '拿出5个东西放在桌子上',
              '数一数确认是5个',
              '模仿数字5的形状写下来',
            ],
            difficulty: 'easy',
          },
          {
            question: '比大小：3和5哪个大？',
            answer: '5大',
            steps: [
              '想象一下，3个苹果和5个苹果放在一起',
              '5个苹果那一堆更多',
              '所以5比3大',
            ],
            difficulty: 'medium',
          },
        ],
        order: 3,
      },
      {
        type: ExplanationSectionType.TIPS,
        title: '家长辅导小技巧',
        content: [
          '✅ 每天找机会练习数数：吃饭时数碗筷、走路时数脚步',
          '✅ 用孩子喜欢的东西来数，比如小汽车、娃娃、糖果',
          '✅ 多表扬孩子的进步，比如"你数得很认真！"',
          '❌ 不要一开始就让孩子背诵数字，要先理解数字的意思',
          '❌ 不要着急，每个孩子学习的速度不一样',
        ],
        order: 4,
      },
    ],
    teachingTips: [
      {
        id: 'tip-nr-001-01',
        title: '用实物演示',
        description: '用孩子喜欢的玩具或食物来演示数字的概念',
        dos: [
          '使用孩子熟悉的物品',
          '慢慢演示过程',
          '让孩子自己动手数',
        ],
        donts: [
          '不要一开始就用抽象数字',
          '不要急于求成',
          '不要批评孩子数错',
        ],
        practiceActivity: '和孩子一起做点心时，数一数用了几块饼干',
      },
      {
        id: 'tip-nr-001-02',
        title: '在生活中找数字',
        description: '帮助孩子发现生活中的数字',
        dos: [
          '指出身边的数字',
          '鼓励孩子说出数字',
          '玩"找数字"游戏',
        ],
        donts: [
          '不要强迫孩子认识所有数字',
          '不要在孩子不感兴趣时强迫学习',
        ],
        practiceActivity: '散步时和孩子一起找路牌上的数字、车牌号码',
      },
    ],
    source: ExplanationSource.TEMPLATE,
    qualityScore: 0.98,
    version: 1,
    reviewed: true,
    childAppropriate: true,
    language: 'zh-CN',
    estimatedReadTime: 5,
    createdAt: new Date('2026-03-21'),
    updatedAt: new Date('2026-03-21'),
  },

  // ========== 10以内加法 ==========
  {
    id: 'exp-template-add-001',
    knowledgePointId: 'kp-add-001',
    knowledgePointName: '10以内加法',
    sections: [
      {
        type: ExplanationSectionType.DEFINITION,
        title: '什么是10以内加法？',
        content: [
          '加法就是把两个数合在一起，算一算一共有多少。',
          '比如你有3个苹果，妈妈又给你2个苹果，算一算你现在有几个苹果？',
          '这就是一个加法问题：3 + 2 = 5，也就是"3加上2等于5"。',
        ],
        order: 1,
      },
      {
        type: ExplanationSectionType.METHODS,
        title: '怎样教孩子做加法？',
        content: [
          '方法一：数手指法。伸出左手3个手指，右手2个手指，合起来数一数是5个。',
          '方法二：画图法。画3个圆圈，再画2个圆圈，数一数一共有5个圆圈。',
          '方法三：接着数法。记住大数3，接着往后数2个数：4、5，答案是5。',
          '方法四：分解组合法。记住5可以分成2和3，所以2+3=5。',
        ],
        order: 2,
      },
      {
        type: ExplanationSectionType.EXAMPLES,
        title: '练习题目',
        content: [],
        examples: [
          {
            question: '3 + 2 = ?',
            answer: '5',
            steps: [
              '伸出3个手指',
              '再伸出2个手指',
              '合起来数一数：1、2、3、4、5',
              '答案是5',
            ],
            difficulty: 'easy',
          },
          {
            question: '小明有4支铅笔，妈妈又给他买了3支，小明现在有几支铅笔？',
            answer: '7支',
            steps: [
              '先数出4支铅笔（可以用手指代表）',
              '再数出3支铅笔',
              '合起来数：1、2、3、4、5、6、7',
              '答案是7支',
            ],
            difficulty: 'medium',
          },
          {
            question: '5 + 0 = ?',
            answer: '5',
            steps: [
              '你有5个糖果',
              '妈妈没有给你新的糖果',
              '你手里的糖果数量没有变化',
              '所以还是5个',
            ],
            difficulty: 'medium',
          },
        ],
        order: 3,
      },
      {
        type: ExplanationSectionType.TIPS,
        title: '家长辅导技巧',
        content: [
          '✅ 用孩子喜欢的物品来练习，比如小汽车、娃娃',
          '✅ 多鼓励孩子，比如"你算对了，真棒！"',
          '✅ 从简单的开始，比如1+1、2+1',
          '❌ 不要让孩子死记硬背答案',
          '❌ 不要在孩子累的时候强迫学习',
        ],
        order: 4,
      },
    ],
    teachingTips: [
      {
        id: 'tip-add-001-01',
        title: '用生活场景教加法',
        description: '把加法问题和日常生活结合起来',
        dos: [
          '用分水果、分玩具来练习',
          '让孩子帮忙分东西',
          '把练习变成游戏',
        ],
        donts: [
          '不要用抽象的数字题目',
          '不要一开始就做难题',
        ],
        practiceActivity: '分零食时让孩子帮忙算一算每人能分几个',
      },
      {
        id: 'tip-add-001-02',
        title: '正确对待错误',
        description: '孩子做错时应该如何处理',
        dos: [
          '耐心地和孩子一起找出错误',
          '用实物演示正确的方法',
          '鼓励孩子再试一次',
        ],
        donts: [
          '不要批评孩子',
          '不要马上说出答案',
          '不要说"这么简单都不会"',
        ],
        practiceActivity: '做错题目时，和孩子一起用实物重新演示一遍',
      },
    ],
    source: ExplanationSource.TEMPLATE,
    qualityScore: 0.97,
    version: 1,
    reviewed: true,
    childAppropriate: true,
    language: 'zh-CN',
    estimatedReadTime: 5,
    createdAt: new Date('2026-03-21'),
    updatedAt: new Date('2026-03-21'),
  },

  // ========== 10以内减法 ==========
  {
    id: 'exp-template-sub-001',
    knowledgePointId: 'kp-sub-001',
    knowledgePointName: '10以内减法',
    sections: [
      {
        type: ExplanationSectionType.DEFINITION,
        title: '什么是10以内减法？',
        content: [
          '减法就是从一些东西里拿走一部分，算一算还剩下多少。',
          '比如你有5个苹果，吃掉了2个，算一算还剩几个苹果？',
          '这就是一个减法问题：5 - 2 = 3，也就是"5减去2等于3"。',
        ],
        order: 1,
      },
      {
        type: ExplanationSectionType.METHODS,
        title: '怎样教孩子做减法？',
        content: [
          '方法一：拿走法。先摆出5个物品，拿走2个，数一数剩下几个。',
          '方法二：倒数法。从5开始，往前数2个数：4、3，答案是3。',
          '方法三：分解法。想5可以分成2和几？5可以分成2和3，所以答案是3。',
          '方法四：加法逆运算。想2加上几等于5？2+3=5，所以5-2=3。',
        ],
        order: 2,
      },
      {
        type: ExplanationSectionType.EXAMPLES,
        title: '练习题目',
        content: [],
        examples: [
          {
            question: '5 - 2 = ?',
            answer: '3',
            steps: [
              '伸出5个手指',
              '弯下2个手指（表示拿走）',
              '数一数剩下几个手指：1、2、3',
              '答案是3',
            ],
            difficulty: 'easy',
          },
          {
            question: '盘子里有6块饼干，小明吃了3块，还剩几块？',
            answer: '3块',
            steps: [
              '先摆出6个东西（代表6块饼干）',
              '拿走3个（代表吃掉的）',
              '数一数剩下的：1、2、3',
              '答案是3块',
            ],
            difficulty: 'medium',
          },
          {
            question: '7 - 0 = ?',
            answer: '7',
            steps: [
              '你有7个玩具',
              '没有拿走任何玩具',
              '玩具的数量没有变化',
              '所以还是7个',
            ],
            difficulty: 'medium',
          },
        ],
        order: 3,
      },
      {
        type: ExplanationSectionType.TIPS,
        title: '家长辅导技巧',
        content: [
          '✅ 用"拿走"、"吃掉"、"用掉"等孩子容易理解的词',
          '✅ 多演示，让孩子自己动手拿走物品',
          '✅ 从简单的开始，比如5-1、5-2',
          '❌ 不要一开始就讲借位减法（那是20以上减法的内容）',
          '❌ 不要用抽象的算式，要配合实物',
        ],
        order: 4,
      },
    ],
    teachingTips: [
      {
        id: 'tip-sub-001-01',
        title: '用生活场景教减法',
        description: '把减法问题和日常生活结合起来',
        dos: [
          '用吃零食、玩游戏来练习',
          '让孩子帮忙分东西',
          '用"少了多少"这样的语言',
        ],
        donts: [
          '不要用太难的应用题',
          '不要一开始就讲抽象概念',
        ],
        practiceActivity: '吃点心时让孩子算一算吃了几个还剩几个',
      },
      {
        id: 'tip-sub-001-02',
        title: '减法比加法难理解',
        description: '减法概念更抽象，需要更多耐心',
        dos: [
          '给孩子更多时间理解',
          '多重复演示',
          '用不同的物品练习',
        ],
        donts: [
          '不要急于求成',
          '不要和其他孩子比较',
        ],
        practiceActivity: '用玩具、糖果、积木等多种物品反复练习',
      },
    ],
    source: ExplanationSource.TEMPLATE,
    qualityScore: 0.97,
    version: 1,
    reviewed: true,
    childAppropriate: true,
    language: 'zh-CN',
    estimatedReadTime: 5,
    createdAt: new Date('2026-03-21'),
    updatedAt: new Date('2026-03-21'),
  },

  // ========== 20以内进位加法 ==========
  {
    id: 'exp-template-add-002',
    knowledgePointId: 'kp-add-002',
    knowledgePointName: '20以内进位加法',
    sections: [
      {
        type: ExplanationSectionType.DEFINITION,
        title: '什么是20以内进位加法？',
        content: [
          '进位加法就是两个数相加，个位数满10了，要往十位进1。',
          '比如8 + 5 = ?',
          '8和5加起来是13，个位上的3写下来，十位上的1要"进"到十位去。',
          '所以8 + 5 = 13。',
        ],
        order: 1,
      },
      {
        type: ExplanationSectionType.METHODS,
        title: '怎样教孩子做进位加法？',
        content: [
          '方法一：凑十法。把8凑成10需要2，所以从5里分出2给8，变成10+3=13。',
          '方法二：接着数法。从8开始，接着往后数5个数：9、10、11、12、13。',
          '方法三：分解法。把5分成2和3，先算8+2=10，再算10+3=13。',
          '⭐ 推荐：凑十法最适合一年级孩子，因为"凑成10"后计算很简单。',
        ],
        order: 2,
      },
      {
        type: ExplanationSectionType.EXAMPLES,
        title: '练习题目',
        content: [],
        examples: [
          {
            question: '8 + 5 = ?',
            answer: '13',
            steps: [
              '想：8凑成10需要2',
              '把5分成2和3',
              '先算8+2=10',
              '再算10+3=13',
              '答案是13',
            ],
            difficulty: 'medium',
          },
          {
            question: '7 + 6 = ?',
            answer: '13',
            steps: [
              '想：7凑成10需要3',
              '把6分成3和3',
              '先算7+3=10',
              '再算10+3=13',
              '答案是13',
            ],
            difficulty: 'medium',
          },
          {
            question: '9 + 4 = ?',
            answer: '13',
            steps: [
              '想：9凑成10需要1',
              '把4分成1和3',
              '先算9+1=10',
              '再算10+3=13',
              '答案是13',
            ],
            difficulty: 'easy',
          },
        ],
        order: 3,
      },
      {
        type: ExplanationSectionType.TIPS,
        title: '家长辅导技巧',
        content: [
          '✅ 先教孩子认识"凑成10"：1+9、2+8、3+7、4+6、5+5',
          '✅ 用实物演示凑十过程，比如用小棒、积木',
          '✅ 多练习凑十，让孩子熟练掌握',
          '❌ 不要一开始就让孩子背诵答案',
          '❌ 不要急着讲竖式计算（那是二年级的内容）',
        ],
        order: 4,
      },
    ],
    teachingTips: [
      {
        id: 'tip-add-002-01',
        title: '凑十法是核心',
        description: '凑十法是进位加法的核心方法',
        dos: [
          '先让孩子熟练掌握10的分解组合',
          '用实物演示凑十过程',
          '多说"8想2凑成10"这样的话',
        ],
        donts: [
          '不要在凑十不熟练时进位加法',
          '不要用太复杂的方法',
        ],
        practiceActivity: '玩凑十游戏：我说8，你说几凑成10？',
      },
      {
        id: 'tip-add-002-02',
        title: '进位加法比较难',
        description: '进位加法是一年级数学难点之一',
        dos: [
          '给孩子更多时间练习',
          '允许孩子用手指数数',
          '多鼓励，少批评',
        ],
        donts: [
          '不要急于求成',
          '不要因为孩子学得慢而焦虑',
        ],
        practiceActivity: '每天练习3-5道题，保持连续性比一次做很多题更有效',
      },
    ],
    source: ExplanationSource.TEMPLATE,
    qualityScore: 0.96,
    version: 1,
    reviewed: true,
    childAppropriate: true,
    language: 'zh-CN',
    estimatedReadTime: 6,
    createdAt: new Date('2026-03-21'),
    updatedAt: new Date('2026-03-21'),
  },

  // ========== 简单应用题 ==========
  {
    id: 'exp-template-wp-001',
    knowledgePointId: 'kp-wp-001',
    knowledgePointName: '简单应用题',
    sections: [
      {
        type: ExplanationSectionType.DEFINITION,
        title: '什么是简单应用题？',
        content: [
          '应用题就是用文字描述的数学问题。',
          '它不像直接算"3+2=?"，而是告诉你一个故事，让你从故事中找出数学问题。',
          '比如："小明有3个苹果，妈妈又给他2个，小明现在有几个苹果？"',
        ],
        order: 1,
      },
      {
        type: ExplanationSectionType.METHODS,
        title: '怎样教孩子做应用题？',
        content: [
          '第一步：读题目。家长和孩子一起大声读题目，确保孩子理解每个字的意思。',
          '第二步：找数字。让孩子指出题目里的数字：3个、2个。',
          '第三步：找问题。问孩子"题目在问什么？"',
          '第四步：判断方法。问"是合起来（加法）还是拿走（减法）？"',
          '第五步：列算式。把数字和运算符号写下来。',
          '第六步：算答案。计算得出结果。',
          '第七步：写单位。别忘了写上"个"、"只"、"块"等单位。',
        ],
        order: 2,
      },
      {
        type: ExplanationSectionType.EXAMPLES,
        title: '练习题目',
        content: [],
        examples: [
          {
            question: '小明有3个苹果，妈妈又给他2个，小明现在有几个苹果？',
            answer: '5个',
            steps: [
              '找数字：3个、2个',
              '找问题：现在有几个？',
              '判断方法："又给他"是合起来，用加法',
              '列算式：3 + 2 = 5',
              '写答案：5个',
            ],
            difficulty: 'easy',
          },
          {
            question: '树上有5只小鸟，飞走了2只，还剩几只？',
            answer: '3只',
            steps: [
              '找数字：5只、2只',
              '找问题：还剩几只？',
              '判断方法："飞走了"是拿走，用减法',
              '列算式：5 - 2 = 3',
              '写答案：3只',
            ],
            difficulty: 'easy',
          },
          {
            question: '停车场有6辆汽车，又开来了4辆，现在一共有几辆汽车？',
            answer: '10辆',
            steps: [
              '找数字：6辆、4辆',
              '找问题：一共有几辆？',
              '判断方法："又开来"是合起来，用加法',
              '列算式：6 + 4 = 10',
              '写答案：10辆',
            ],
            difficulty: 'medium',
          },
        ],
        order: 3,
      },
      {
        type: ExplanationSectionType.TIPS,
        title: '家长辅导技巧',
        content: [
          '✅ 教孩子找关键词："一共"、"合起来"→加法；"还剩"、"飞走"→减法',
          '✅ 允许孩子画图来理解题意',
          '✅ 多读几遍题目，确保孩子理解',
          '❌不要直接告诉孩子用加法还是减法',
          '❌不要因为孩子理解慢而着急',
        ],
        order: 4,
      },
    ],
    teachingTips: [
      {
        id: 'tip-wp-001-01',
        title: '关键词识别法',
        description: '教孩子通过关键词判断用加法还是减法',
        dos: [
          '总结常用的加法关键词：一共、合起来、总共、增加',
          '总结常用的减法关键词：还剩、用掉、飞走、吃掉、拿走',
          '让孩子圈出题目中的关键词',
        ],
        donts: [
          '不要让孩子只记关键词不理解题意',
          '不要用太复杂的题目',
        ],
        practiceActivity: '和孩子一起玩"关键词侦探"游戏，找出题目中的关键词',
      },
      {
        id: 'tip-wp-001-02',
        title: '画图理解法',
        description: '教孩子用画图来理解题目',
        dos: [
          '鼓励孩子用简单的图形代表题目中的东西',
          '用圆圈代表苹果，用小三角形代表小鸟',
          '用画图的方式展示"合起来"或"拿走"',
        ],
        donts: [
          '不要追求画得漂亮',
          '不要因为孩子不会画而批评',
        ],
        practiceActivity: '每道应用题都让孩子画一画，帮助理解',
      },
    ],
    source: ExplanationSource.TEMPLATE,
    qualityScore: 0.98,
    version: 1,
    reviewed: true,
    childAppropriate: true,
    language: 'zh-CN',
    estimatedReadTime: 6,
    createdAt: new Date('2026-03-21'),
    updatedAt: new Date('2026-03-21'),
  },

  // ========== 认识图形 ==========
  {
    id: 'exp-template-geo-001',
    knowledgePointId: 'kp-geo-001',
    knowledgePointName: '认识图形',
    sections: [
      {
        type: ExplanationSectionType.DEFINITION,
        title: '什么是图形？',
        content: [
          '图形就是我们看到的各种形状。',
          '一年级主要学习认识平面图形：圆形、正方形、长方形、三角形。',
          '生活中到处都是这些图形，比如车轮是圆形，窗户是长方形。',
        ],
        order: 1,
      },
      {
        type: ExplanationSectionType.METHODS,
        title: '怎样教孩子认识图形？',
        content: [
          '第一步：认识图形的名称。给孩子看图形卡片，说出每个图形的名字。',
          '第二步：找图形的特征。圆形圆圆的没有角，正方形四边一样长，长方形对边一样长，三角形有三个角。',
          '第三步：在生活中找图形。让孩子指出家里的物品是什么形状。',
          '第四步：动手做图形。用纸剪出各种图形，用橡皮泥捏出图形。',
        ],
        order: 2,
      },
      {
        type: ExplanationSectionType.EXAMPLES,
        title: '练习题目',
        content: [],
        examples: [
          {
            question: '下面哪个是圆形？🔴 ⬜ 🔺',
            answer: '🔴',
            steps: [
              '圆形是圆圆的，没有角',
              '第一个图形是圆圆的，没有角',
              '所以第一个是圆形',
            ],
            difficulty: 'easy',
          },
          {
            question: '数一数，下面有几个三角形？🔺🔺 ⬜ 🔺',
            answer: '3个',
            steps: [
              '三角形有3个角',
              '一个一个地数',
              '1、2、3，共3个三角形',
            ],
            difficulty: 'easy',
          },
          {
            question: '说一说，你的橡皮擦是什么形状？',
            answer: '长方形',
            steps: [
              '观察橡皮擦的形状',
              '它有4条边，对边一样长',
              '这是长方形的特征',
              '所以橡皮擦是长方形',
            ],
            difficulty: 'medium',
          },
        ],
        order: 3,
      },
      {
        type: ExplanationSectionType.TIPS,
        title: '家长辅导技巧',
        content: [
          '✅ 多让孩子观察生活中的物品是什么形状',
          '✅ 和孩子一起用积木拼出各种图形',
          '✅ 玩"找图形"游戏：在家里找出圆形、正方形的物品',
          '❌不要一开始就讲边、角、顶点等抽象概念',
          '❌不要用复杂的图形（如梯形、菱形）混淆孩子',
        ],
        order: 4,
      },
    ],
    teachingTips: [
      {
        id: 'tip-geo-001-01',
        title: '生活中的图形',
        description: '用生活中的物品帮助孩子认识图形',
        dos: [
          '指出家里的物品是什么形状',
          '让孩子收集各种形状的物品',
          '用物品摆出各种图形',
        ],
        donts: [
          '不要只用图片，要多用实物',
          '不要局限于课本上的例子',
        ],
        practiceActivity: '和孩子一起在家里找图形：时钟是圆形，地砖是正方形',
      },
      {
        id: 'tip-geo-001-02',
        title: '动手做图形',
        description: '让孩子动手制作和感受图形',
        dos: [
          '用纸剪出各种图形',
          '用橡皮泥捏出图形',
          '用积木拼出图形',
        ],
        donts: [
          '不要只让孩子看不动手',
          '不要追求做得完美',
        ],
        practiceActivity: '和孩子一起用卡纸制作图形拼贴画',
      },
    ],
    source: ExplanationSource.TEMPLATE,
    qualityScore: 0.97,
    version: 1,
    reviewed: true,
    childAppropriate: true,
    language: 'zh-CN',
    estimatedReadTime: 5,
    createdAt: new Date('2026-03-21'),
    updatedAt: new Date('2026-03-21'),
  },
];

/**
 * 根据知识点ID获取模板讲解
 */
/**
 * 根据知识点ID获取模板讲解
 * Story 3-4: 添加格式支持字段到返回的模板
 */
export function getTemplateExplanationByKnowledgePointId(
  knowledgePointId: string
): Explanation | undefined {
  const template = TEMPLATE_EXPLANATIONS.find(
    exp => exp.knowledgePointId === knowledgePointId
  );

  if (!template) {
    return undefined;
  }

  // Story 3-4: 添加格式支持字段
  return {
    ...template,
    availableFormats: [ExplanationFormat.TEXT],
    currentFormat: ExplanationFormat.TEXT,
    formatMetadata: {
      textContent: `${template.knowledgePointName}讲解内容`,
    },
  };
}

/**
 * 获取所有模板讲解
 */
export function getAllTemplateExplanations(): Explanation[] {
  return [...TEMPLATE_EXPLANATIONS];
}

/**
 * 验证模板讲解内容的质量
 */
export function validateTemplateExplanation(
  explanation: Explanation
): {valid: boolean; errors: string[]} {
  const errors: string[] = [];

  // 检查必需的章节
  const requiredSections = [
    ExplanationSectionType.DEFINITION,
    ExplanationSectionType.METHODS,
    ExplanationSectionType.EXAMPLES,
    ExplanationSectionType.TIPS,
  ];

  const presentSections = explanation.sections.map(s => s.type);
  requiredSections.forEach(section => {
    if (!presentSections.includes(section)) {
      errors.push(`缺少必需章节: ${section}`);
    }
  });

  // 检查例题数量
  const examplesSection = explanation.sections.find(
    s => s.type === ExplanationSectionType.EXAMPLES
  );
  if (examplesSection && examplesSection.examples) {
    if (examplesSection.examples.length < 3) {
      errors.push('例题数量不足，至少需要3个例题');
    }
  }

  // 检查辅导技巧数量
  if (explanation.teachingTips.length < 2) {
    errors.push('辅导技巧数量不足，至少需要2个技巧');
  }

  // 检查质量分数
  if (explanation.qualityScore < 0.8) {
    errors.push(`质量分数过低: ${explanation.qualityScore}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
