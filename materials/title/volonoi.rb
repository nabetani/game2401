W0=512
H0=900
ZW0=W0*4
ZH0=H0*4

init = "-size #{ZW0}x#{ZH0} xc: -colorspace RGB -depth 16"
$rng = Random.new
def rndx; $rng.rand(1..(ZW0-2)); end
def rndy; $rng.rand(1..(ZH0-2)); end
def rndc;
  t = $rng.rand*3
  c = ->(x0){
    x = x0 % 3
    return $rng.rand(2)*255 if 2<x
    (255.0/2*(1-Math.cos(x*Math::PI))).round
  }
  # p [t, c[t], c[t+1], c[t+2]]
  "#%02x%02x%02x" % [c[t], c[t+1], c[t+2]]
end

cols = [
  *Array.new(100){ "#{rndx},#{rndy} #{rndc}" },
  *Array.new(100){
    r = $rng.rand( ZW0/10.0 ) + ZW0/2.5
    t = $rng.rand * Math::PI*2
    x = r * Math.cos(t) + ZW0/2
    y = r * Math.sin(t) + ZH0/2
    "#{x},#{y} #{rndc}" }
].join(" ")

v0 = "-sparse-color Voronoi '#{cols}'"
scale = "-scale 25%"
cmd = [
  init, v0, scale
].join(" ")
%x(convert #{cmd} title.webp)
