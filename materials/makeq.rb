require "json"
require "digest/sha2"

HERE = File.absolute_path(File.split(__FILE__).first)

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

LINE_COUNT = 15

def sample_num(min, max, seed)
  s = Digest::SHA2.new.then{ _1<<seed.to_json;Integer(_1.hexdigest,16) }
  min + s % (max-min+1)
end

def select_q(lines)
  ix = lines.index{ |x| 1<x[:t].size }
  post = lines.size-ix-1
  pre_min = (LINE_COUNT-post-1).clamp(2,LINE_COUNT-3)
  pre_max = ix.clamp(3,LINE_COUNT-2)
  pre = sample_num(pre_min,pre_max,lines[0])
  [
    *lines[ix-pre, pre],
    lines[ix],
    *lines[ix+1,LINE_COUNT-pre-1]
  ]
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
    return select_q(lines) if ok
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
  ref={t:ref_text}
  ref[:url] = url if url
  body = get_text(s.split(/^\-{3,}$/).last)
  body.each.with_index{ |e,ix| p [ ix, e ] }
  {ref:ref, body:body}
end

def main
  failed = false
  q=Dir.glob( File.join(HERE, "cropped_texts/*.txt")).sort.map{ |fn|
    begin
      build(File.open(fn, &:read))
    rescue => e
      p( { fn:fn, e:e } )
      raise
    end
  }
  raise "failed" if failed
  File.open(File.join(HERE,"../src/q.json"), "w") do |f|
    pp q
    f.puts( JSON.pretty_generate({Q:q}))
  end
end

Dir.chdir( HERE ) do
  main
end
