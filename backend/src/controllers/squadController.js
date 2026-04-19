const squadModel = require('../models/squadModel');

async function listSquads(req, res) {
  try {
    const squads = await squadModel.getAllSquads();
    return res.json({ squads });
  } catch (error) {
    console.error('List squads error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getSquad(req, res) {
  try {
    const { id } = req.params;
    const squad = await squadModel.getSquadById(id);
    if (!squad) {
      return res.status(404).json({ message: 'Squad not found' });
    }
    const members = await squadModel.getSquadMembers(id);
    return res.json({ squad, members });
  } catch (error) {
    console.error('Get squad error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function createSquad(req, res) {
  try {
    console.log('createSquad called with body:', req.body);
    const { name, description } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Squad name is required' });
    }

    const userId = req.user.id;
    const squadId = await squadModel.createSquad(name, description, userId);
    
    return res.status(201).json({ message: 'Squad created', squadId });
  } catch (error) {
    console.error('Create squad error:', error);
    if (error.message === 'Squad name already exists') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function joinSquad(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const joined = await squadModel.joinSquad(id, userId);
    if (!joined) {
      return res.status(400).json({ message: 'Already a member or squad not found' });
    }
    
    return res.json({ message: 'Joined squad successfully' });
  } catch (error) {
    console.error('Join squad error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function leaveSquad(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const left = await squadModel.leaveSquad(id, userId);
    if (!left) {
      return res.status(400).json({ message: 'Not a member or squad not found' });
    }
    
    return res.json({ message: 'Left squad successfully' });
  } catch (error) {
    console.error('Leave squad error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function mySquads(req, res) {
  try {
    const userId = req.user.id;
    const squads = await squadModel.getUserSquads(userId);
    return res.json({ squads });
  } catch (error) {
    console.error('My squads error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  listSquads,
  getSquad,
  createSquad,
  joinSquad,
  leaveSquad,
  mySquads
};
