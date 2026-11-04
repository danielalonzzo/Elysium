'use strict';

const express = require('express');

const TENANT_ID = 'elysiumdr-eu';
const TEAM_EMAIL = /^[^@\s]+@elysiumdr\.eu$/i;

/**
 * El equipo: correos @elysiumdr.eu verificados y cuentas con acceso explícito
 * al CRM (los mismos claims que `crmIsCompanyMember` de firestore.rules).
 * `requireUser` ya exige el correo verificado.
 */
function isTeamIdentity(identity) {
  return TEAM_EMAIL.test(String(identity?.email || ''))
    || (identity?.crmAccess === true && identity?.crmTenantId === TENANT_ID);
}

/**
 * Acceso a Elysium Tools (`/api/tools-license`; la ruta conserva el nombre
 * del modelo anterior, que pedía una licencia aparte aprobada a mano).
 *
 * Las herramientas son para quien ya tiene cuenta en Elysium: un cliente del
 * CRM (`members/{uid}`) o el equipo. Iniciar sesión basta: no hay solicitud,
 * licencia ni aprobación, y el subdominio no crea cuentas. Desactivar el
 * perfil en el CRM corta el acceso; a un administrador, nunca. La ruta solo
 * lee: nada de lo que llega desde Tools escribe en el CRM.
 */
function createToolsLicenseRouter({ db, requireUser, isAdmin = () => false }) {
  const router = express.Router();
  router.use(requireUser);
  router.use((_req, res, next) => { res.set('Cache-Control', 'private, no-store'); next(); });

  router.get('/access', async (req, res, next) => {
    try {
      const user = req.firebaseUser;
      const member = await db.collection('members').doc(user.uid).get();
      const profile = member.exists ? member.data() : null;
      const admin = isAdmin(user) === true;
      const team = admin || isTeamIdentity(user);
      const status = !admin && profile?.isDeactivated === true ? 'suspended'
        : team || member.exists ? 'active' : 'no_account';
      res.json({
        allowed: status === 'active',
        uid: user.uid,
        account: { status, kind: team ? 'team' : member.exists ? 'client' : null },
        profile: { name: profile?.name || user.name || '', email: user.email }
      });
    } catch (error) { next(error); }
  });
  return router;
}

module.exports = { createToolsLicenseRouter, isTeamIdentity };
