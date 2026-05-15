const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

router.get('/', authenticate, authorize('admin'), userController.getAll);
router.get('/:id', authenticate, userController.getById);
router.put('/:id', authenticate, userController.update);
router.delete('/:id', authenticate, authorize('admin'), userController.remove);

module.exports = router;
