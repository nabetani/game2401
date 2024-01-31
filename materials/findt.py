import spacy
import glob
import os

nlp = spacy.load('ja_ginza_electra')

def readFile(fn):
  with open(fn, mode="r") as f:
    return f.read()

def findTights(fn):
  all = readFile(fn)
  lim=4096
  for ix in range((len(all)+lim-1)//lim):
    text = all[ix*lim:(ix+1)*lim]
    # print( len(text))
    doc = nlp(text)
    src=""
    kana=""
    for sent in doc.sents:
        for token in sent:
            src = (src+token.orth_)[-70:]
            if token.dep_=='punct':
              continue
            # print(
            #     token.i,
            #     token.orth_,
            #     # token.lemma_,
            #     # token.norm_,
            #     token.morph.get("Reading"),
            #     # token.pos_,
            #     token.morph.get("Inflection"),
            #     token.tag_,
            #     token.dep_,
            #     # token.head.i
            #     )
            for e in token.morph.get("Reading"):
              kana = (kana+e)[-70:]
            if "タイツ" in kana[:60]:
              print( src )
              print( kana)
              kana=""
              print("----")

for fn in glob.glob('texts/*.txt'):
  print(fn)
  findTights(fn)
