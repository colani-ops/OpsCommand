using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Identity;
using OpsCommand.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

using OpsCommand.Api.Infrastructure.Data;

namespace OpsCommand.Api.Repositories.Squads
{
    public class SquadRepository : ISquadRepository
    {
        private readonly ApplicationDbContext _context;
        public SquadRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Squad>> GetAllAsync()
        {

            return await _context.Squads.ToListAsync();

        }

        public async Task<Squad> GetByIdAsync(int id)
        {
            return await _context.Squads.FindAsync(id);
        }



        public async Task AddAsync(Squad squad)
        {
            await _context.Squads.AddAsync(squad);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Squad squad)
        {
            _context.Squads.Update(squad);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Squad squad)
        {
            _context.Squads.Remove(squad); //Za sada hard delete - kasnije soft delete!
            await _context.SaveChangesAsync();
        }
    }
}
