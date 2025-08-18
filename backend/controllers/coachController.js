// controllers/coachController.js
import mongoose from 'mongoose';
import Coach from '../models/Coach.js';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function parseBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v !== 'string') return false;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
}

function parseCSV(v) {
  if (!v) return [];
  return String(v)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

const SORT_MAP = {
  'name-asc': { name: 1 },
  'name-desc': { name: -1 },
  'rating-desc': { rating: -1, name: 1 },
  'price-asc': { priceFrom: 1, name: 1 },
};

export async function listCoaches(req, res) {
  try {
    const {
      q,
      specialization,
      specialization_in, // optional: multi via CSV
      languages,
      rating_min,
      price_min,
      price_max,
      online,
      verified,
      sort = 'name-asc',
      page = '1',
      limit = '24',
    } = req.query;

    const pageNum = clamp(parseInt(page, 10) || 1, 1, 10_000);
    const limitNum = clamp(parseInt(limit, 10) || 24, 1, 100);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { role: 'coach' };

    // specialization (single or CSV)
    if (specialization && specialization !== 'all') {
      query.specialization = specialization;
    }
    const multiSpecs = parseCSV(specialization_in);
    if (multiSpecs.length > 0) {
      query.specialization = { $in: multiSpecs };
    }

    // languages CSV: matches any
    const langArr = parseCSV(languages);
    if (langArr.length > 0) {
      query.languages = { $in: langArr };
    }

    // min rating
    const rmin = Number(rating_min);
    if (!Number.isNaN(rmin) && rmin > 0) {
      query.rating = { $gte: rmin };
    }

    // price range
    const pmin = Number(price_min);
    const pmax = Number(price_max);
    if (!Number.isNaN(pmin) || !Number.isNaN(pmax)) {
      query.priceFrom = {};
      if (!Number.isNaN(pmin)) query.priceFrom.$gte = pmin;
      if (!Number.isNaN(pmax)) query.priceFrom.$lte = pmax;
      if (Object.keys(query.priceFrom).length === 0) delete query.priceFrom;
    }

    // flags
    if (online !== undefined) query.isOnline = parseBool(online);
    if (verified !== undefined) query.isVerified = parseBool(verified);

    // text search (q)
    let textScoreProj = {};
    let sortSpec = SORT_MAP[sort] || SORT_MAP['name-asc'];

    const collation = { locale: 'tr', strength: 1 }; // Turkish A–Z

    let cursor;
    if (q && q.trim().length > 0) {
      // prefer $text if index exists; fallback to case-insensitive regex on name
      query.$text = { $search: q.trim() };
      textScoreProj = { score: { $meta: 'textScore' } };
      // When text score available, sort by it first unless a specific sort chosen
      if (!SORT_MAP[sort]) {
        sortSpec = { score: { $meta: 'textScore' }, name: 1 };
      }
      cursor = Coach.find(query, textScoreProj).collation(collation);
    } else {
      cursor = Coach.find(query).collation(collation);
    }

    const [data, total] = await Promise.all([
      cursor.sort(sortSpec).skip(skip).limit(limitNum).lean(),
      Coach.countDocuments(query),
    ]);

    res.set('Cache-Control', 'public, max-age=30, s-maxage=60'); // tiny cache for GETs
    return res.json({
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
      hasNext: skip + data.length < total,
      hasPrev: pageNum > 1,
      data,
    });
  } catch (err) {
    console.error('listCoaches error:', err);
    return res.status(500).json({ message: 'Server error listing coaches.' });
  }
}

export async function getCoach(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid coach id' });
    }
    const coach = await Coach.findById(id).lean();
    if (!coach) return res.status(404).json({ message: 'Coach not found' });
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120');
    return res.json(coach);
  } catch (err) {
    console.error('getCoach error:', err);
    return res.status(500).json({ message: 'Server error fetching coach.' });
  }
}
