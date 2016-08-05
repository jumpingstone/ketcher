var Box2Abs = require('../util/box2abs');
var Vec2 = require('../util/vec2');
var Visel = require('./visel');
var ReObject = require('./reobject');

function ReFrag(/* Struct.Fragment = {}*/frag) {
	this.init(Visel.TYPE.FRAGMENT);

	this.item = frag;
}
ReFrag.prototype = new ReObject();
ReFrag.isSelectable = function () {
	return false;
};

ReFrag.findClosest = function (render, p, skip, minDist) {
	minDist = Math.min(minDist || render.opt.selectionDistanceCoefficient, render.opt.selectionDistanceCoefficient);
	var ret;
	render.ctab.frags.each(function (fid, frag) {
		if (fid != skip) {
			var bb = frag.calcBBox(render, fid); // TODO any faster way to obtain bb?
			if (bb.p0.y < p.y && bb.p1.y > p.y && bb.p0.x < p.x && bb.p1.x > p.x) {
				var xDist = Math.min(Math.abs(bb.p0.x - p.x), Math.abs(bb.p1.x - p.x));
				if (!ret || xDist < minDist) {
					minDist = xDist;
					ret = { id: fid, dist: minDist };
				}
			}
		}
	});
	return ret;
};

ReFrag.prototype.fragGetAtoms = function (render, fid) {
	var ret = [];
	render.ctab.atoms.each(function (aid, atom) {
		if (atom.a.fragment == fid)
			ret.push(aid);
	}, this);
	return ret;
};

ReFrag.prototype.fragGetBonds = function (render, fid) {
	var ret = [];
	render.ctab.bonds.each(function (bid, bond) {
		if (render.ctab.atoms.get(bond.b.begin).a.fragment == fid &&
		render.ctab.atoms.get(bond.b.end).a.fragment == fid)
			ret.push(bid);
	}, this);
	return ret;
};

ReFrag.prototype.calcBBox = function (render, fid) { // TODO need to review parameter list
	var ret;
	render.ctab.atoms.each(function (aid, atom) {
		if (atom.a.fragment == fid) {
			// TODO ReObject.calcBBox to be used instead
			var bba = atom.visel.boundingBox;
			if (!bba) {
				bba = new Box2Abs(atom.a.pp, atom.a.pp);
				var ext = new Vec2(0.05 * 3, 0.05 * 3);
				bba = bba.extend(ext, ext);
			} else {
				bba = bba.translate((render.offset || new Vec2()).negated()).transform(render.scaled2obj, render);
			}
			ret = (ret ? Box2Abs.union(ret, bba) : bba);
		}
	}, this);
	return ret;
};

ReFrag.prototype._draw = function (render, fid, attrs) { // TODO need to review parameter list
	var bb = this.calcBBox(render, fid);
	if (bb) {
		var p0 = render.obj2scaled(new Vec2(bb.p0.x, bb.p0.y));
		var p1 = render.obj2scaled(new Vec2(bb.p1.x, bb.p1.y));
		return render.paper.rect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y, 0).attr(attrs);
	} else { // eslint-disable-line no-else-return
		// TODO abnormal situation, empty fragments must be destroyed by tools
	}
};

ReFrag.prototype.draw = function (render) { // eslint-disable-line no-unused-vars
	return null;// this._draw(render, fid, { 'stroke' : 'lightgray' }); // [RB] for debugging only
};

ReFrag.prototype.drawHighlight = function (render) { // eslint-disable-line no-unused-vars
	// Do nothing. This method shouldn't actually be called.
};

ReFrag.prototype.setHighlight = function (highLight, render) {
	var fid = render.ctab.frags.keyOf(this);
	if (!Object.isUndefined(fid)) {
		render.ctab.atoms.each(function (aid, atom) {
			if (atom.a.fragment == fid)
				atom.setHighlight(highLight, render);
		}, this);
		render.ctab.bonds.each(function (bid, bond) {
			if (render.ctab.atoms.get(bond.b.begin).a.fragment == fid)
				bond.setHighlight(highLight, render);
		}, this);
	} else {
		// TODO abnormal situation, fragment does not belong to the render
	}
};

module.exports = ReFrag;
