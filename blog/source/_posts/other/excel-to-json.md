---
title: Excel转Json小脚本
notshow: false
date: 2021-12-06 19:28:44
tags:
categories:
---

python2.7写的

# Excel数据
<img src="excel-to-json-1.png" alt="excel" stype="horizontal-align:left">

# Json数据
kv的形式：
```
{
    "1": {
        "bool_key": true, 
        "float_key": 11.11, 
        "id": 1, 
        "int_key": 11, 
        "list_int_key": [
            1, 
            2, 
            3
        ], 
        "list_str_key": [
            "l1", 
            "l2", 
            "l3"
        ], 
        "string_key": "test1", 
        "time_key": 1638633600
    }, 
    "2": {
        "bool_key": false, 
        "float_key": 22.22, 
        "id": 2, 
        "int_key": 22, 
        "list_int_key": [
            1
        ], 
        "list_str_key": [
            "l1"
        ], 
        "string_key": "test2", 
        "time_key": 1638720000
    }
}
```

list的形式：
```
[
    {
        "bool_key": true, 
        "float_key": 11.11, 
        "id": 1, 
        "int_key": 11, 
        "list_int_key": [
            1, 
            2, 
            3
        ], 
        "list_str_key": [
            "l1", 
            "l2", 
            "l3"
        ], 
        "string_key": "test1", 
        "time_key": 1638633600
    }, 
    {
        "bool_key": false, 
        "float_key": 22.22, 
        "id": 2, 
        "int_key": 22, 
        "list_int_key": [
            1
        ], 
        "list_str_key": [
            "l1"
        ], 
        "string_key": "test2", 
        "time_key": 1638720000
    }
]
```

# 脚本
```
#coding=utf-8

import sys
reload(sys)
sys.setdefaultencoding('utf-8')

import math
import xlrd
import json
import datetime
import time

def handleInt(rawValue):
    if rawValue == '':
        return 0
    return int(rawValue)

def handleFloat(rawValue):
    if rawValue == '':
        return 0
    return float(rawValue)

def handleBool(rawValue):
    try:
        if int(rawValue) == 1:
            return True
            
    except Exception as e:
        pass
    return False

def handleStr(rawValue):
    try:
        intvalue = int(rawValue)
        floatvalue = float(rawValue)
        if intvalue != 0 and intvalue == floatvalue:
            return str(intvalue)

    except Exception as e:
        pass

    return str(rawValue)

def handleBigNum(rawValue):
    i = int(rawValue)
    s = str(i)
    l = len(s)
    if l == 1:
        return {"a": i, "b": 0}
    
    b = math.pow(10, l - 1)
    a = float(i / b)
    return {"a": a, "b": l - 1}

def handleListStr(rawValue):
    arr = []

    if rawValue == '':
        return arr

    for a in rawValue.split(','):
        arr.append(str(a))

    return arr

def handleListInt(rawValue):
    arr = []

    rawValue = str(rawValue)
    if rawValue == '':
        return arr

    for a in rawValue.split(','):
        try:
            v = float(a)
            v = int(v)
        except Exception as e:
            v = int(a)
        arr.append(v)

    return arr

def handleTime(rawValue):
    tuple = xlrd.xldate_as_tuple(rawValue, 0)
    excel_datetime = datetime.datetime(*tuple)
    timestamp = time.mktime(excel_datetime.timetuple())
    return int(timestamp)

def getDataHandleFunc(typeName):
    dic = {
        'int'      : handleInt,
        'str'      : handleStr,
        'string'   : handleStr,
        'float'    : handleFloat,
        'bool'     : handleBool,
        'bignum'   : handleBigNum,
        'list|str' : handleListStr,
        'list|int' : handleListInt,
        'time'     : handleTime,
    }

    if typeName not in dic:
        raise Exception("type err: %s" % typeName)

    return dic[typeName]


def convert(srcFileName, sheetName, desFileName, kvMode):
    print 'Start %s : %s ---> %s' % (srcFileName, sheetName, desFileName)

    try:
        wb = xlrd.open_workbook(filename=srcFileName)
    except Exception as e:
        print srcFileName, 'can not open'
        return

    try:
        sheet = wb.sheet_by_name(sheetName)
    except Exception as e:
        print 'file:', srcFileName, '    sheet:', sheetName, '    not exist'
        return

    data = []
    if kvMode:
        data = {}
    
    varNames  = sheet.row_values(1)        # ['id', ' type', 'name' ...]
    typeNames = sheet.row_values(2)        # ['int', 'int',  'str'  ...]

    key = "id"
    for row in xrange(3, sheet.nrows):
        if sheet.cell_value(row, 0) == "":
            break

        rowData = {}
        for idx, col in enumerate(xrange(sheet.ncols)):
            cellValue = sheet.cell_value(row, col)
            if idx >= len(typeNames) or idx >= len(varNames):
                continue
            if typeNames[idx] == "" or varNames[idx] == "":
                break


            if typeNames[idx].startswith('list.'):
                typeArr = typeNames[idx].split('.')
                func = getDataHandleFunc(typeArr[1])
            else:
                func = getDataHandleFunc(typeNames[idx])
    
            varName = varNames[idx]

            if typeNames[idx].startswith('list.'):
                rowData.setdefault(varName, [])

            if cellValue == 'null':
                if typeNames[idx].startswith('list.'):
                    rowData[varName].append('')
                else:
                    rowData[varName] = ''
                continue

            try:
                realVal = func(cellValue)
                if typeNames[idx].startswith('list.'):
                    rowData[varName].append(realVal)
                else:
                    rowData[varName] = realVal
                    if idx == 0 and kvMode:
                        key = str(rowData[varName])
            except Exception as e:
                raise Exception("func: %s, err: %s, row: %d, col:%d, rawData:%s" % (typeNames[idx], e, row, col, cellValue))

        if kvMode:
            data[key] = rowData
        else:
            data.append(rowData)
        
    with open(desFileName, 'w') as f:
        f.write(json.dumps(data, indent=4, sort_keys=True, ensure_ascii=False, encoding='utf-8'))

    print 'Done %s : %s ---> %s' % (srcFileName, sheetName, desFileName)

    return data

if __name__ == '__main__':
    data = [
        ["测试表.xlsx", "测试KV", "TestKV.json", 1],
        ["测试表.xlsx", "测试列表", "TestList.json", 0],
    ]

    for line in data:
        try:
            srcFileName = line[0]
            sheetName   = line[1]
            desFileName = line[2]
            kvMode      = line[3]
        except Exception as e:
                raise Exception('convertList file format invalid')

        if kvMode == 0:
            kvMode = False
        elif kvMode == 1:
            kvMode = True

        convert(srcFileName, sheetName, desFileName, kvMode)

```