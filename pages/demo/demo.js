const { CascadedPickerView } = require('../../components/cascaded-picker-view/cascaded-picker-view.js');
const { CascadedPicker } = require('../../components/cascaded-picker/cascaded-picker.js');
const { provinces, cities, areas } = require('../../utils/data.js');

Page({
    // 嵌入的地区选择器对象
    areaPicker: null,

    // 弹出的地区选择器对象
    areaPicker2: null,

    data: {
        areaPickerData: null,
        areaPickerData2: null,
        selectedAreaText: null,
    },

    initAreaPicker: function() {
        const loadOptionsMethod = (pv, index, callback) => {
            wx.showLoading({
                title: '加载中...',
                mask: true,
            });

            let promise = new Promise((resolve, reject) => {
                // 读取省份数据
                if (index === 0) {
                    let options = provinces.map((item) => {
                        return { text: item.name, value: item.id };
                    });
                    resolve(options);
                    return;
                }

                // 未指定上级选项时
                if (!pv) {
                    resolve([]);
                    return;
                }

                // 读取城市数据
                if (index === 1) {
                    let options = cities[pv];
                    if (options) {
                        options = options.map((item) => {
                            return { text: item.name, value: item.id };
                        });
                    }
                    resolve(options);
                    return;
                }

                // 读取地区数据
                if (index === 2) {
                    let options = areas[pv];
                    if (options) {
                        options = options.map((item) => {
                            return { text: item.name, value: item.id };
                        });
                    }
                    resolve(options);
                    return;
                }

                resolve([]);
            });
            
            // 模拟网络延迟，如要取消模拟，注释掉以下代码即可
            promise = promise.then((options) => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => { resolve(options); }, Math.floor(Math.random() * 1500));
                });
            });

            // 模拟异常，如要取消模拟，注释掉以下代码即可
            promise = promise.then((options) => {
                if (Math.floor(Math.random() * 1000) % 10 === 0) {
                    throw new Error('网络异常');
                }
                return options;
            });

            promise.then((options) => {
                wx.hideLoading();

                callback(options);
            }).catch((error) => {
                wx.hideLoading();

                wx.showModal({
                    title: '错误',
                    content: '数据载入错误',
                    confirmText: '重试',
                    complete: (res) => {
                        if (res.confirm) {
                            loadOptionsMethod(pv, index, callback);
                        }
                    },
                });
            });
        }

        this.areaPicker = new CascadedPickerView(this, 'areaPickerData', {
            promptText: '',
            promptTexts: ['-省-', '-市-', '-区-'],
            pickerCount: 3,
            initValues: ['450000', '450200', '450202'],
            loadOptionsMethod: loadOptionsMethod,
        });

        this.areaPicker2 = new CascadedPicker(this, 'areaPickerData2', {
            promptText: '',
            promptTexts: ['-省-', '-市-', '-区-'],
            pickerCount: 3,
            initValues: ['450000', '450200', '450202'],
            loadOptionsMethod: loadOptionsMethod,
            onCancel: () => {
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
        });
    },

    onLoad: function (options) {
        this.initAreaPicker();
    },

    onOpenAreaPicker2Click: function() {
        this.areaPicker2.show();
    },
})