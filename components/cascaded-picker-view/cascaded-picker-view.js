// 级联选择器计数器，每创建一个级联选择器则计数器增加1，
// 通过计数器动态创建级联选择器在页面上的方法的唯一标识。
let counter = 0;


/**
 * 嵌入页面的级联选择器，用于构造一个类似省、市、县联动的选择器组。
 */
class CascadedPickerView {
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
     * }=} options               选项
     */
    constructor(page, dataKey, {
        promptText = '-请选择-',
        promptTexts = null,
        pickerCount = null,
        initValues = null,
        loadOptionsMethod = (obj, parentValue, pickerIndex, callback) => { callback([]); },
    } = {}) {
        // 当前级联选择器对象的唯一标识
        this._id = counter += 1;

        this._page = page;
        this._dataKey = dataKey;

        this._promptText = promptText;
        this._promptTexts = promptTexts;
        this._pickerCount = pickerCount;
        this._initValues = initValues;
        this._loadOptionsMethod = loadOptionsMethod;

        // 初始化
        this._init();
    }

    /**
     * 选择器 bindchange 回调方法名。
     */
    get _onChangeName() {
        return `__CascadedPickerView_${ this._id }_onChange`;
    }

    /**
     * 获取级联选择器对象的数据。
     * @param {string=}  key     获取数据的键值，如果不指定，则返回级联选择器
     *                           对象的包装数据对象
     * @returns {Object}         数据
     */
    _getData(key) {
        let data = this._page.data[this._dataKey];
        if (!key) {
            return data;
        }
        if (!data) {
            return undefined;
        }
        return data[key];
    }

    /**
     * 确保级联选择器的数据已经存在于 page 的 data 中。
     */
    _ensureData() {
        if (!this._page.data[this._dataKey]) {
            this._page.data[this._dataKey] = {};
        }
    }

    /**
     * 移除级联选择器的数据。
     */
    _removeData() {
        let uData = {};
        uData[this._dataKey] = undefined;
        this._page.setData(uData);
    }

    /**
     * 设置级联选择器对象的数据。
     * @param {string=}  key     数据的键值
     * @param {string=}  val     对应键的值
     * @param {boolear=false} silently   静默更新，即不使用 page 的 setData 方法更新，不会触发页面更新。
     * @returns void
     */
    _setData(key, val, silently = false) {
        this._ensureData();
        let data = this._getData();
        data[key] = val;
        
        if (silently) {
            return;
        }

        let uData = {};
        uData[this._dataKey] = data;
        this._page.setData(uData);
    }

    /**
     * 创建指定索引的选择器的提示文本。
     * @param {number}  pickerIndex     指定选择器的索引
     * @returns {string}    指定索引的选择器的提示文本。
     */
    _createPickerPromptText(pickerIndex) {
        let text = this._promptText;
        if (this._promptTexts && this._promptTexts.length > pickerIndex && this._promptTexts[pickerIndex]) {
            text = this._promptTexts[pickerIndex];
        }
        if (text) {
            text = text.replace(/{{\\s+index\\s+}}/gi, pickerIndex + 1);
        }
        return text;
    }

    /**
     * 获取所有选择器的提示文本数据。
     * @returns {string[]}    所有选择器的提示文本集合。
     */
    get _pickerPromptTexts() {
        return this._getData('promptTexts');
    }

    /**
     * 获取指定索引位置的选择器的提示文本。
     * @param {number}  pickerIndex     指定选择器的索引
     * @returns {string}    指定选择器的提示文本。
     */
    _getPickerPromptText(pickerIndex) {
        let texts = this._pickerPromptTexts;
        if (!texts) {
            return undefined;
        }
        return texts[pickerIndex];
    }

    /**
     * 根据选择器的数量，调整提示文本数据。
     * @param {number}  count     选择器的数量
     */
    _adjustPromptText(count) {
        let texts = this._pickerPromptTexts;
        let changed = false;
        if (!texts) {
            texts = [];
            changed = true;
        }
        if (texts.length > count) {
            texts.length = count;
            changed = true;
        }
        if (texts.length < count) {
            let length = texts.length;
            for (let i = length; i < count; i++) {
                texts[i] = this._createPickerPromptText(i);
            }
            changed = true;
        }
        if (changed) {
            this._setData('promptTexts', texts);
        }
    }

    /**
     * 获取选项组数据。
     */
    get _optionsGroups() {
        return this._getData('optionsGroups');
    }

    /**
     * 设置选项组数据。
     * @param {Array}  val     设置的选项组数据
     * 选项组为每个选择器的选项数据集合的集合，即：
     * [
     *     [],  // picker-view-column1 选项集合
     *     [],  // picker-view-column2 选项集合
     *     ...
     *     [],  // picker-view-columnN 选项集合
     * ]
     */
    set _optionsGroups(val) {
        this._adjustPromptText(val ? val.length : 0);
        this._setData('optionsGroups', val);
    }

    /**
     * 获取指定索引位置的选项组的数据。
     * @param {number}  index     获取选项组的索引
     * @returns {Array}           指定索引位置的选项组的数据。
     */
    _getOptionsGroup(index) {
        let optionsGroups = this._optionsGroups;
        if (!optionsGroups) {
            return undefined;
        }
        return optionsGroups[index];
    }

    /**
     * 设置指定索引位置的选项组的数据。
     * @param {number}  index     设置选项组的索引
     * @param {Array}  items     设置选项组的数据
     */
    _setOptionsGroup(index, items) {
        let optionsGroups = this._optionsGroups;
        if (!optionsGroups) {
            optionsGroups = [];
        }
        optionsGroups[index] = items;
        this._optionsGroups = optionsGroups;
    }

    /**
     * 获取选择的索引项。
     */
    get _selectIndexs() {
        return this._getData('selectIndexs');
    }

    /**
     * 设置选择的索引项。
     * @param {number[]}  selectIndexs     设置选择的索引项
     */
    set _selectIndexs(selectIndexs) {
        this._setData('selectIndexs', selectIndexs);
    }

    /**
     * 修改选择的索引项，不触发UI更新。
     * @param {number[]}  selectIndexs     修改选择的索引项
     */
    _changeSelectIndexs(selectIndexs) {
        this._setData('selectIndexs', selectIndexs, true);
    }

    /**
     * 获取指定索引的选择器的选择项索引。
     * @param {number}  pickerIndex     指定选择器的索引
     */
    _getSelectIndex(pickerIndex) {
        let selectIndexs = this._selectIndexs;
        if (!selectIndexs) {
            return undefined;
        }
        return selectIndexs[pickerIndex];
    }

    /**
     * 设置指定索引的选择器的选择项索引。
     * @param {number}  pickerIndex     指定选择器的索引
     * @param {number}  selectIndex     要设置的指定索引的选择器的选择项索引
     */
    _setSelectIndex(pickerIndex, selectIndex) {
        let selectIndexs = this._selectIndexs;
        if (!selectIndexs) {
            selectIndexs = [];
        }
        selectIndexs[pickerIndex] = selectIndex;
        this._selectIndexs = selectIndexs;
    }

    /**
     * 获取指定索引的选择器的选择数据项索引（即去除提示项后的索引）。
     * @param {number}  pickerIndex     指定选择器的索引
     */
    _getSelectDataIndex(pickerIndex) {
        let index = this._getSelectIndex(pickerIndex);
        if(typeof(index) !== 'number') {
            return index;
        }

        let text = this._getPickerPromptText(pickerIndex);
        if (text) {
            index -= 1;
        }
        return index;
    }

    /**
     * 根据选择的值更新指定选择器的选择项索引。
     * @param {number}  pickerIndex     指定选择器的索引
     * @param {any}  value              指定选择器的选择值
     */
    _updateSelectIndexByValue(pickerIndex, value) {
        let items = this._getOptionsGroup(pickerIndex) || [];
        let index = items.findIndex((item) => { return item.value === value });
        let text = this._getPickerPromptText(pickerIndex);
        if (text) {
            index += 1;
        }
        this._setSelectIndex(pickerIndex, index);
    }

    /**
     * 初始化级联选择器对象。
     */
    _init() {
        // 初始选项组
        let optionsGroups = [[]];
        if (this._pickerCount && this._pickerCount > 1) {
            for (let i = 1; i < this._pickerCount; i++) {
                optionsGroups.push([]);
            }
        }
        this._optionsGroups = optionsGroups;

        // 创建选择器事件回调
        let onChangeName = this._onChangeName;
        this._page[onChangeName] = (e) => {
            this._onChange(e);
        }
        this._setData('onChangeName', onChangeName);

        // 初始第一个选择器的数据
        this._onPickerChange(null, null, this._initValues);
    }

    /**
     * 当指定索引的选择器值变更时触发的方法。
     * @param {number}  index     引发数据变更的选择器索引
     * @param {any}  value        数据变更后的值
     * @param {any}  vals         所有选择器的默认值集合
     */
    _onPickerChange(index, value, vals = null) {
        if ((typeof (index) != 'number') || index < 0) {
            index = -1;
        }

        if (vals && vals.length > index) {  // 如果指定选择器的值，则根据值更新选择器的索引
            value = vals[index];
            this._updateSelectIndexByValue(index, value);
        }

        let nIndex = index + 1;
        this._loadOptionsMethod(this, value, nIndex, (items) => {
            if (!items || items.length <= 0) {
                let optionsGroups = this._optionsGroups;
                if (!optionsGroups || nIndex >= optionsGroups.length) {
                    // nIndex 位置的选择器没有数据，并且超出了当前已有选择器的数量，则不作处理
                    return;
                }
                items = [];
            }

            this._setOptionsGroup(nIndex, items);

            let selectIndex = this._getSelectDataIndex(nIndex);

            let item = null;
            if (selectIndex >= 0) {
                item = items[selectIndex];
            }

            this._onPickerChange(nIndex, item ? item.value : null, vals);
        });
    }


    /**
     * 验证选择器值的变更，返回首个变更值的选择器索引。
     * @param {Array.<number>}  newSelectIndexs     级联选择器变更后的值集合。
     * @param {Array.<number>}  preSelectIndexs     级联选择器变更前的值集合。
     * @returns {number}         首个变更值的选择器索引，如果未变更，则返回-1。
     */
    _checkPickerChange(newSelectIndexs, preSelectIndexs) {
        if (!preSelectIndexs) {
            return 0;
        }

        for (let i = 0; i < newSelectIndexs.length; i++) {
            if (newSelectIndexs[i] != preSelectIndexs[i]) {
                return i;
            }
        }
        return -1;
    }

    /**
     * 当选择器变更时的回调函数。
     */
    _onChange(e) {
        console.log(`CascadedPickerView ${this._id} onChange: ${e.detail.value }`);

        let selectIndexs = e.detail.value;
        let pickerIndex = this._checkPickerChange(selectIndexs, this._selectIndexs);
        this._changeSelectIndexs(selectIndexs);

        if (pickerIndex != -1) {
            let selectIndex = this._getSelectDataIndex(pickerIndex);

            let item = null;
            if (selectIndex >= 0) {
                let items = this._getOptionsGroup(pickerIndex) || [];
                item = items[selectIndex];
            }

            this._onPickerChange(pickerIndex, item ? item.value : null);
        }
    }

    /**
     * 获取级联选择器的值。
     * @returns {Array}      级联选择器对应各选择器的值集合。
     */
    get values() {
        return this.selectItems.map((item) => { return item ? item.value : undefined });
    }

    /**
     * 设置级联选择器的值。
     * @param {Array}  values     级联选择器对应各选择器的值集合。
     */
    set values(values) {
        this._onPickerChange(null, null, values);
    }

    /**
     * 获取级联选择器选中的项目集合。
     */
    get selectItems() {
        let items = [];

        let optionsGroups = this._optionsGroups;
        if (optionsGroups) {
            for (let i = 0; i < optionsGroups.length; i++) {
                let optionsGroup = optionsGroups[i];
                let index = this._getSelectDataIndex(i);
                let item = undefined;
                if (optionsGroup && typeof (index) === 'number') {
                    item = optionsGroup[index];
                }
                items[i] = item;
            }
        }
        return items;
    }

    /**
     * 获取指定索引的选择器的选项。
     */
    getPickerOptions(pickerIndex) {
        return this._getOptionsGroup(pickerIndex);
    }

    /**
     * 销毁对象。
     */
    destroy() {
        this._removeData();
        delete this._page[this._onChangeName];
    }
}


module.exports = {
    CascadedPickerView: CascadedPickerView,
}