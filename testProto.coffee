#!/usr/bin/env coffee

> ./protoscript.gen@3-.js > ErrMsgEncode ErrMsgDecode ERR_CODE_FORM CallLiEncode CallLiDecode

call_li = [
  [
    3
    new Uint8Array [3,2,1]
  ]
  [
    5
    new Uint8Array [7,9]
  ]
]

bin = CallLiEncode call_li
console.log call_li
console.log CallLiDecode bin
