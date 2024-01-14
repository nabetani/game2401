require "json"

HERE = File.split(__FILE__).first

LEN=16

def splitg(s)
  r=[]
  s.each_grapheme_cluster{ r<<_1 }
  r
end

def canbe_head(s)
  case s
  when /[\p{Terminal_Punctuation}\p{Close_Punctuation}\p{Final_Punctuation}]/; false # 閉じ括弧等
  when /[\-\.\,\!\?\:\;\p{Terminal_Punctuation}\p{Close_Punctuation}\p{Final_Punctuation}]/; false # 句読点等
  when /[ャュョッァィゥェォゃゅょっぁぃぅぇぉヵヶゝゞ々ヾー゛゜]/; false
  else; true
  end
end

def canbe_tail(s)
  case s
  when /[\p{Initial_Punctuation}\p{Open_Punctuation}]/; false # 開き括弧等
  else; true
  end
end

def split_text( s0, first, last )
  (0...).each do |ix|
    s = s0.drop(ix)
    lines=[]
    consumed = ix
    ok = false
    candidates=[0,1,-1,2,3,4,5,6,7,8].map{ LEN - _1 }
    while LEN+8<s.size
      x = candidates.find{
        canbe_tail(s[_1-1]) && canbe_head(s[_1])
      }
      line = s.take(x)
      o = if consumed<first && last<consumed+x
        ok = true
        a = first - consumed
        b = last - consumed
        [line[0,a], line[a,(b-a)], line[b...]].map(&:join)
      else
        [line.join]
      end
      lines.push( {t:o} )
      s = s.drop(x)
      consumed += x
    end
    return lines if ok
  end
end

def get_text(s0)
  s1=s0.strip.gsub( /[\r\n\t[:space:]]/, "")
  ix0 = s1.index("[[")
  ix1 = s1.index("]]")
  s2 = s1.gsub( "[[", "").gsub("]]", "").chars
  t_first = ix0
  t_last = ix1-2
  split_text( s2, t_first, t_last )
end

def build(s)
  ref_text = /^text\s*\:\s*([^\r\n]+)/.match(s)[1].gsub( '\n', "\n")
  url = /^url\s*\:\s*([^\r\n]+)/.match(s)&.[](1)
  ref={text:ref_text}
  ref[:url] = url if url
  {ref:ref, body:get_text(s.split(/^\-{3,}$/).last)}
end

def main
  q=Dir.glob( File.join(HERE, "cropped_texts/*.txt")).map{ |fn|
    build(File.open(fn, &:read))
  }
  puts JSON.pretty_generate(q)
end

main
