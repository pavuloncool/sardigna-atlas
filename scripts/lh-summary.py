import json,sys
src,dst,label=sys.argv[1:4]
r=json.load(open(src)); a=r['audits']
def m(k): return a[k]['displayValue'] if k in a else None
out={
 "page":r['requestedUrl'],"form_factor":r['configSettings'].get('formFactor'),"throttling":r['configSettings'].get('throttlingMethod'),
 "label":label,"lighthouse":r['lighthouseVersion'],"fetchTime":r['fetchTime'],
 "scores":{k:round(v['score']*100) for k,v in r['categories'].items()},
 "metrics":{"FCP":m('first-contentful-paint'),"LCP":m('largest-contentful-paint'),"CLS":m('cumulative-layout-shift'),"TBT":m('total-blocking-time'),"SpeedIndex":m('speed-index')},
 "failedAudits":[k for k,v in a.items() if v.get('score')==0],
}
json.dump(out,open(dst,'w'),indent=1,ensure_ascii=False)
print(label.ljust(34), out['scores'], out['metrics']['LCP'], out['metrics']['CLS'], out['failedAudits'])
