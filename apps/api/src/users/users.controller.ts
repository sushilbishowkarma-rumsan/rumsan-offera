import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/roles.guard';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllUsers() {
    return this.usersService.findAll();
  }

  // @Get('me')
  // @UseGuards(JwtAuthGuard)
  // async getMe(@Req() req: any) {
  //   return this.usersService.findById(req.user.id); // jwt.strategy validate() maps sub → id
  // }

  @Get('managers')
  @UseGuards(JwtAuthGuard)
  getManagers() {
    return this.usersService.findManagers();
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard)
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: 'EMPLOYEE' | 'MANAGER' | 'HRADMIN',
  ) {
    return this.usersService.updateRole(id, role);
  }

  @Patch(':id/department')
  @UseGuards(JwtAuthGuard)
  async updateDepartment(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.usersService.updateDepartment(id, dto.department);
  }

  // Get all users (HR Admin)
  // @Get()
  // async getAllUsers() {
  //   return this.prisma.user.findMany({
  //     select: {
  //       id: true,
  //       name: true,
  //       email: true,
  //       role: true,
  //       createdAt: true,
  //     },
  //   });
  // }
}
