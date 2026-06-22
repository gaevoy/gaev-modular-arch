namespace Gaev.User.Contracts;

public record UserDto(Guid Id, string Name, string Email);
public record CreateUserRequest(string Name, string Email);
