const { CascadedPickerView } = require('../cascaded-picker-view/cascaded-picker-view.js');

/**
 * 从底部弹起的级联选择器，用于构造一个类似省、市、县联动的选择器组。
 */
class CascadedPicker extends CascadedPickerView {
    /**
     * @param {Object}  page     页面对象。
     * @param {string}  dataKey  级联选择器数据键值。
     * @param {{
     *     @param {string=}  promptText            选择器的提示文本
     *     @param {string=}  promptTexts           选择器的提示文本数组，按索引位置匹配相应的提示文本。
     *     @param {number=}  pickerCount           选择器的数量，如果为 null ，则自动根据联动情况动态生成选择器
     *     @param {Array=}  initValues             选择器初始值。
     *     @param {Function=}  loadOptionsMethod(obj, parentValue, pickerIndex, callback)
     *                                             选择器选项数据加载方法，方法参数如下：
     *                                             @param {Object} obj 代表当前级联选择器对象
     *                                             @param {any} parentValue 代表上级选择器的选择值
     *                                             @param {number} pickerIndex 代表当前加载选项数据的选择器的索引
     *                                             @param {Function} callback 方法为数据载入完成后的回调方法，该方
     *                                             接收一个Array对象代表选项的集合。
     * 
     *     @param {Function=}  onCancel            点击取消时的回调方法。
     *     @param {Function=}  onConfirm           点击确定时的回调方法。
     * }=} options               选项
     */
    constructor(page, dataKey, {
        promptText = '-请选择-',
        promptTexts = null,
        pickerCount = null,
        initValues = null,
        loadOptionsMethod = (obj, parentValue, pickerIndex, callback) => { callback([]); },

        onCancel = null,
        onConfirm = null,
    } = {}) {
        super(page, dataKey, {
            promptText: promptText,
            promptTexts: promptTexts,
            pickerCount: pickerCount,
            initValues: initValues,
            loadOptionsMethod: loadOptionsMethod,
        });

        this._onCancel = onCancel;
        this._onConfirm = onConfirm;
    }

    /**
     * 当取消按钮点击时的回调方法名。
     */
    get _onCancelName() {
        return `__CascadedPicker_${this._id}_onCancelClick`;
    }

    /**
     * 当确定按钮点击时的回调方法名。
     */
    get _onConfirmName() {
        return `__CascadedPicker_${this._id}_onConfirmClick`;
    }

    /**
     * 初始化级联选择器对象。
     */
    _init() {
        super._init();

        // 创建选择器事件回调
        let onCancelName = this._onCancelName;
        this._page[onCancelName] = (e) => {
            this._onCancelClick(e);
        }
        this._setData('onCancelName', onCancelName);

        let onConfirmName = this._onConfirmName;
        this._page[onConfirmName] = (e) => {
            this._onConfirmClick(e);
        }
        this._setData('onConfirmName', onConfirmName);
    }

    _onCancelClick(e) {
        this.hide();

        if (this._onCancel) {
            this._onCancel({
                obj: this,
            });
        }
    }

    _onConfirmClick(e) {
        this.hide();

        if (this._onConfirm) {
            this._onConfirm({
                obj: this,
                values: this.values,
            });
        }
    }

    /**
     * 显示级联选择器。
     */
    show() {
        this._setData('showed', true);
    }

    /**
     * 隐藏级联选择器。
     */
    hide() {
        this._setData('showed', false);
    }

    /**
     * 销毁对象。
     */
    destroy() {
        super.destroy();

        delete this._page[this._onCancelName];
        delete this._page[this._onConfirmName];
    }
}


module.exports = {
    CascadedPicker: CascadedPicker,
}