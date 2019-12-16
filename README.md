# React Final Fantasy Form
> React's 最终の幻想 ✕ 表单

# Todos
-  Wanted

```jsx
<Field computed={[data.start, data.end]} label="datarange">
/** value =[];
[
  ['start', 0],
  ['end', 1],
]
 value1 = _.get(data, 'start');
 _.set(value, 0, value1);
 value2 = _.get(data, 'end');
 _.set(value, 0, value2);
 value -> <DatePick value={value} />
*/

 <DatePick ></DatePick>
</Field>
```
<Field computed={{ province: data.province, city: data.city, district: data.district }} label="datarange">
/** value =[];
[
  ['province', 'province'],
  ['city', 'city'],
  ['district', 'district'],
]
 value -> <PCD value={value} />
*/

 <PCD></PCD>
</Field>
```
- undo / redo
- validate 完善
- jest
