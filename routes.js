import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Bot en línea');
});

export default router;
