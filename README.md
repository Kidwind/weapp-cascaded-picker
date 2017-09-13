# weapp-cascaded-picker
一个基于微信小程序的级联（联动）选择器组件，用于构造一 组类似省、市、县联动的选择器。

## 说明
weapp-cascaded-picker 项目分为两个组件，以适用于不同的场景：
1. cascaded-picker-view 嵌入页面的级联选择器。
2. cascaded-picker 从底部弹起的级联选择器。

## 特点
1. 自定义数据加载方法，可以需要实同步或异步的数据加载机制。
2. 理论上无限级的关联（介面宽度决定了不可能显示太多级）。
3. 可以设置初始值，介面自动回显初始选项。
4. 基于值进行数据的操作，而非选项索引（小程序原生的 picker-view 组件是基于索引的，但通常我们更关注值），意味着你无需在值和索引间转换，更易用。
5. 任何类型的关联数据，需转换为 cascaded-picker 所识别的标准格式，即：
```
{
    text: '文本',
    value: '值'
}
```

## cascaded-picker-view 的使用
1. 复制文件夹 components 到你的项目跟目录中。
2. 在需要使用相应组件的页面文件中，引入相应的组件文件。
```
/* .wxss 文件中引用 */
@import '../../components/cascaded-picker-view/cascaded-picker-view.wxss';
```

```
<!-- .wxml 文件中引用 -->
<import src="../../components/cascaded-picker-view/cascaded-picker-view.wxml" />
```

```
// .js 文件中引用
const { CascadedPickerView } = require('../../components/cascaded-picker-view/cascaded-picker-view.js');
```

3. 在页面 .js 中创建 CascadedPickerView 实例。
```
Page({
    // 嵌入的地区选择器对象
    areaPicker: null,

    data: {
        areaPickerData: null,   // 地区选择器的数据
    },

    initAreaPicker: function() {
        this.areaPicker = new CascadedPickerView(
            this,     // 页面对象
            'areaPickerData',   // 关联的页面数据键值（即页面对象 data 属性中代表 cascaded-picker 对象数据的字段名）
            {
                promptText: '-请选择-',    // 默认选择器的提示文本
                promptTexts: ['-省-', '-市-', '-区-'],   // 按索引位置针对性指定选择器的提示文本
                pickerCount: 3,     // 初始的选择器数量
                initValues: ['450000', '450100', '450101'],   // 初始的选择器值
                loadOptionsMethod: (parentValue, pickerIndex, callback) => {    // 加载指定选择器选项集合的方法
                    // 方法参数说明：
                    // parentValue - 上一级选择器选定的项目的值，根据该值读取关联的数据。
                    // pickerIndex - 代表当前要加载选项数据的选择器的索引。
                    // callback - 数据加载完成后的回调方法，该方法接受一个代表选项集合的参数，选项集合中的选项需转换为 cascaded-picker 所识别的标准格式，即：
                    //     {
                    //         text: '文本',
                    //         value: '值'
                    //     }
                    // 根据需要实现相应的加载选择器选项数据的逻辑。
                    if (pickerIndex === 0) {    // 读取第一级选择器选项
                        callback([
                            {
                                text: '广西',
                                value: '450000'
                            },
                        ]);
                        return;
                    }
                    
                    if (!parentValue) {
                        callback(null);
                        return;
                    }

                    if (pickerIndex === 1) {    // 读取第二级选择器选项
                        callback([
                            {
                                text: '南宁',
                                value: '450100'
                            },
                        ]);
                        return;
                    }

                    if (pickerIndex === 2) {    // 读取第三级选择器选项
                        callback([
                            {
                                text: '市辖区',
                                value: '450101'
                            },
                        ]);
                        return;
                    }

                    callback(null);
                },
            }
        );
    },

    onLoad: function (options) {
        this.initAreaPicker();
    },
})
```

4. 在页面 .wxml 文件的特定位置引用 cascaded-picker 的模板。
```
<template is="cascaded-picker-view" data="{{ data: areaPickerData }}" />
```

5.完成。

## cascaded-picker 的使用
cascaded-picker 的使用与 cascaded-picker-view 类似，主要区别在于 cascaded-picker 默认是不显示的，需要手动调用实便的 show() 方法来弹出级联选择器，构造参数增加了 onCancel 及 onConfirm 回调参数，用于响应当用户点击取消或确认按钮时的事件。以下对两个回调方法的说明：
1. onCancel({ obj: this }) - 回调方法接收一个对象，该对象包含一个 obj 属性，代表当前级联选择器对象。
2. onConfirm({ obj: this, values: this.values }) - 回调方法接收一个对象，该对象包含两个属性：(1) obj - 代表当前级联选择器对象；(2) values - 代表当前联选择器的值。
```
this.areaPicker = new CascadedPicker(
    this,     // 页面对象
    'areaPickerData',   // 关联的页面数据键值（即页面对象 data 属性中代表 cascaded-picker 对象数据的字段名）
    {
        ...,
        onCancel: (e) => {
            wx.showToast({
                title: '点击了取消',
            });
        },
        onConfirm: (e) => {
            this.setData({
                selectedAreaText: e.obj.selectItems.map((item) => { return item ? item.text : ''; }).join(' - '),
            });

            wx.showModal({
                content: `点击了确定，值为：${ e.values }`,
            })
        }
    }
);
```

## 方法&属性说明
### 共有方法&属性
1. values - 获取或设置级联选择器的值，值应以数组的方式表示各选择器的选定值。如：['450000', '450100', '450101']
2. selectItems - 获取级联选择器的选定项目数组。
3. destroy - 销毁对象。

### cascaded-picker 方法&属性
1. show() - 显示级联选择器。
2. hide() - 隐藏级联选择器。
