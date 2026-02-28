// src/models/Event.js
const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'O título é obrigatório'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'A descrição é obrigatória'
      }
    }
  },
  featuredImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Data de início inválida'
      }
    }
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Data de término inválida'
      },
      isAfterStartDate(value) {
        if (value <= this.startDate) {
          throw new Error('A data de término deve ser posterior à data de início');
        }
      }
    }
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'False se passou 7 dias após endDate'
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'events',
  timestamps: false,
  underscored: false,
  indexes: [
    { fields: ['isPublished', 'isActive'] },
    { fields: ['startDate', 'endDate'] }
  ]
});

// =============================================
// MÉTODOS DE INSTÂNCIA
// =============================================

/**
 * Verifica se o evento ainda está ativo (não expirou)
 * Um evento expira 7 dias após a data de término
 */
Event.prototype.checkIfActive = function() {
  const now = new Date();
  const sevenDaysAfterEnd = new Date(this.endDate);
  sevenDaysAfterEnd.setDate(sevenDaysAfterEnd.getDate() + 7);
  
  return now <= sevenDaysAfterEnd;
};

/**
 * Retorna informações formatadas do evento
 */
Event.prototype.getFormattedDates = function() {
  return {
    start: this.startDate.toLocaleDateString('pt-PT'),
    end: this.endDate.toLocaleDateString('pt-PT'),
    startTime: this.startDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
    endTime: this.endDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  };
};

/**
 * Verifica se o evento está acontecendo agora
 */
Event.prototype.isHappeningNow = function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
};

/**
 * Verifica se o evento é futuro
 */
Event.prototype.isFuture = function() {
  const now = new Date();
  return this.startDate > now;
};

/**
 * Verifica se o evento já terminou
 */
Event.prototype.isPast = function() {
  const now = new Date();
  return this.endDate < now;
};

/**
 * Verifica o status atual do evento
 */
Event.prototype.getStatus = function() {
  const now = new Date();
  const startDate = new Date(this.startDate);
  const endDate = new Date(this.endDate);
  const sevenDaysAfterEnd = new Date(endDate);
  sevenDaysAfterEnd.setDate(sevenDaysAfterEnd.getDate() + 7);
  
  if (now < startDate) {
    return 'future';
  } else if (now >= startDate && now <= endDate) {
    return 'ongoing';
  } else if (now > endDate && now <= sevenDaysAfterEnd) {
    return 'recently_ended';
  } else {
    return 'long_ended';
  }
};

/**
 * Retorna texto descritivo do status
 */
Event.prototype.getStatusText = function() {
  const status = this.getStatus();
  const texts = {
    future: 'Evento Futuro',
    ongoing: 'Em Andamento',
    recently_ended: 'Recém Terminado',
    long_ended: 'Evento Finalizado'
  };
  return texts[status] || 'Desconhecido';
};

// =============================================
// MÉTODOS ESTÁTICOS
// =============================================

/**
 * Desativa eventos que terminaram há mais de 7 dias
 * Mas isso NÃO impede que apareçam na página pública
 */
Event.deactivateExpiredEvents = async function() {
  try {
    const now = new Date();
    
    // Calcular data de 7 dias atrás
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    console.log('🔍 Verificando eventos expirados...');
    console.log('   Data atual:', now.toISOString());
    console.log('   Data limite (7 dias atrás):', sevenDaysAgo.toISOString());
    
    // ✅ Apenas marcar como inativo, mas NÃO filtrar na exibição pública
    const result = await Event.update(
      { isActive: false },
      {
        where: {
          endDate: {
            [Op.lte]: sevenDaysAgo  // ✅ Eventos que terminaram há 7+ dias
          },
          isActive: true  // Apenas os que ainda estão ativos
        }
      }
    );
    
    if (result[0] > 0) {
      console.log(`✅ ${result[0]} evento(s) marcado(s) como inativo`);
    } else {
      console.log('✅ Nenhum evento para marcar como inativo');
    }
    
    return result[0];
  } catch (error) {
    console.error('❌ Erro ao marcar eventos como inativos:', error);
    return 0;
  }
};

/**
 * Reativa eventos que foram desativados mas ainda estão dentro do período de 7 dias
 * Útil para corrigir eventos desativados incorretamente
 */
Event.reactivateValidEvents = async function() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const result = await Event.update(
      { isActive: true },
      {
        where: {
          endDate: {
            [Op.gte]: sevenDaysAgo  // Eventos que terminaram há menos de 7 dias
          },
          isActive: false,  // Que estão inativos
          isPublished: true  // E que estão publicados
        }
      }
    );
    
    if (result[0] > 0) {
      console.log(`✅ ${result[0]} evento(s) reativado(s)`);
    }
    
    return result[0];
  } catch (error) {
    console.error('❌ Erro ao reativar eventos:', error);
    return 0;
  }
};

/**
 * Busca eventos ativos e publicados
 */
Event.getActiveEvents = async function() {
  try {
    return await Event.findAll({
      where: {
        isPublished: true,
        isActive: true
      },
      order: [['startDate', 'ASC']]
    });
  } catch (error) {
    console.error('❌ Erro ao buscar eventos ativos:', error);
    return [];
  }
};

/**
 * Busca eventos futuros (ainda não começaram)
 */
Event.getUpcomingEvents = async function(limit = 10) {
  try {
    const now = new Date();
    
    return await Event.findAll({
      where: {
        isPublished: true,
        isActive: true,
        startDate: {
          [Op.gt]: now
        }
      },
      order: [['startDate', 'ASC']],
      limit
    });
  } catch (error) {
    console.error('❌ Erro ao buscar eventos futuros:', error);
    return [];
  }
};

/**
 * Busca eventos em andamento
 */
Event.getCurrentEvents = async function() {
  try {
    const now = new Date();
    
    return await Event.findAll({
      where: {
        isPublished: true,
        isActive: true,
        startDate: {
          [Op.lte]: now
        },
        endDate: {
          [Op.gte]: now
        }
      },
      order: [['startDate', 'ASC']]
    });
  } catch (error) {
    console.error('❌ Erro ao buscar eventos em andamento:', error);
    return [];
  }
};

module.exports = Event;