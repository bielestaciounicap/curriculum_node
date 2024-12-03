const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// Rota para obter as informações do currículo
router.get('/', async (req, res) => {
  try {
    const personalInfoResult = await pool.query('SELECT * FROM personal_info LIMIT 1');
    if (personalInfoResult.rows.length === 0) {
      return res.status(404).json({ message: 'Nenhuma informação encontrada' });
    }

    const personalInfo = personalInfoResult.rows[0];
    const personalInfoId = personalInfo.id;

    const experiencesResult = await pool.query('SELECT * FROM experiences WHERE personal_info_id = $1', [personalInfoId]);
    const skillsResult = await pool.query('SELECT * FROM skills WHERE personal_info_id = $1', [personalInfoId]);

    res.json({
      personalInfo: {
        id: personalInfo.id,
        name: personalInfo.name,
        email: personalInfo.email,
        phone: personalInfo.phone,
        summary: personalInfo.summary, // Novo campo: resumo
      },
      experiences: experiencesResult.rows.map(exp => ({
        id: exp.id,
        companyName: exp.company_name,
        position: exp.position,
        startDate: exp.start_date,
        endDate: exp.end_date,
        description: exp.description,
      })),
      skills: skillsResult.rows.map(skill => ({
        id: skill.id,
        name: skill.name,
        proficiency: skill.proficiency,
        description: skill.description,
      })),
    });
  } catch (err) {
    console.error('Erro ao buscar informações do currículo:', err.message);
    res.status(500).json({ error: 'Erro ao buscar informações do currículo' });
  }
});

// Rota POST para criar um novo currículo
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, summary, experiences, skills } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Os campos nome, email e telefone são obrigatórios' });
    }

    const personalInfoResult = await pool.query(
      'INSERT INTO personal_info (name, email, phone, summary) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, phone, summary] // Incluir o campo summary
    );

    const personalInfoId = personalInfoResult.rows[0].id;

    if (experiences && experiences.length > 0) {
      for (const exp of experiences) {
        await pool.query(
          'INSERT INTO experiences (company_name, position, start_date, end_date, description, personal_info_id) VALUES ($1, $2, $3, $4, $5, $6)',
          [exp.companyName, exp.position, exp.startDate, exp.endDate, exp.description, personalInfoId]
        );
      }
    }

    if (skills && skills.length > 0) {
      for (const skill of skills) {
        await pool.query(
          'INSERT INTO skills (name, proficiency, description, personal_info_id) VALUES ($1, $2, $3, $4)',
          [skill.name, skill.proficiency, skill.description, personalInfoId]
        );
      }
    }

    res.status(201).json({
      message: 'Currículo criado com sucesso!',
      personalInfoId,
    });
  } catch (err) {
    console.error('Erro ao criar currículo:', err.message);
    res.status(500).json({ error: 'Erro ao criar currículo' });
  }
});

// Rota PUT para atualizar informações pessoais
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, summary } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ message: 'Os campos nome, email e telefone são obrigatórios' });
  }

  try {
    const result = await pool.query(
      'UPDATE personal_info SET name = $1, email = $2, phone = $3, summary = $4 WHERE id = $5 RETURNING *',
      [name, email, phone, summary, id] // Incluir o campo summary
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Currículo não encontrado' });
    }

    res.status(200).json({ message: 'Currículo atualizado com sucesso', updatedPersonalInfo: result.rows[0] });
  } catch (err) {
    console.error('Erro ao atualizar currículo:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar currículo' });
  }
});

// Rota DELETE para excluir informações pessoais
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM experiences WHERE personal_info_id = $1', [id]);
    await pool.query('DELETE FROM skills WHERE personal_info_id = $1', [id]);

    const result = await pool.query('DELETE FROM personal_info WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Currículo não encontrado' });
    }

    res.status(200).json({ message: 'Currículo excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir currículo:', err.message);
    res.status(500).json({ error: 'Erro ao excluir currículo' });
  }
});

// Rota POST para adicionar uma nova experiência
router.post('/experiences', async (req, res) => {
  try {
    const { companyName, position, startDate, endDate, description, personalInfoId } = req.body;

    if (!companyName || !position || !startDate || !personalInfoId) {
      return res.status(400).json({ message: 'Os campos companyName, position, startDate e personalInfoId são obrigatórios' });
    }

    const result = await pool.query(
      'INSERT INTO experiences (company_name, position, start_date, end_date, description, personal_info_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [companyName, position, startDate, endDate, description, personalInfoId]
    );

    res.status(201).json({
      message: 'Experiência adicionada com sucesso!',
      experience: result.rows[0],
    });
  } catch (err) {
    console.error('Erro ao adicionar experiência:', err.message);
    res.status(500).json({ error: 'Erro ao adicionar experiência' });
  }
});

// Rota POST para adicionar uma nova skill
router.post('/skills', async (req, res) => {
  try {
    const { name, proficiency, description, personalInfoId } = req.body;

    if (!name || !proficiency || !personalInfoId) {
      return res.status(400).json({ message: 'Os campos name, proficiency e personalInfoId são obrigatórios' });
    }

    const result = await pool.query(
      'INSERT INTO skills (name, proficiency, description, personal_info_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, proficiency, description, personalInfoId]
    );

    res.status(201).json({
      message: 'Skill adicionada com sucesso!',
      skill: result.rows[0],
    });
  } catch (err) {
    console.error('Erro ao adicionar skill:', err.message);
    res.status(500).json({ error: 'Erro ao adicionar skill' });
  }
});

module.exports = router;

