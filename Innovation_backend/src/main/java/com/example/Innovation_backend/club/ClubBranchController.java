package com.example.Innovation_backend.club;

import com.example.Innovation_backend.club.dto.BranchResponse;
import com.example.Innovation_backend.club.dto.MemberResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Branch endpoints.
 *
 *   GET /api/club/branches                   auth (member|leader|admin)  ACTIVE branches at caller's university
 *   GET /api/club/branches/{id}              auth (member|leader|admin)  one branch, same-university only
 *   GET /api/club/branches/{id}/members      auth (member|leader|admin)  directory (universities already gated inside service)
 *
 * Phase 5A follow-up: branches are now scoped by the caller's university. A
 * SUZA member sees only SUZA branches; admins see every branch. SecurityConfig
 * no longer permits these GETs publicly — the @PreAuthorize below (and the
 * service-level scoping) is what enforces access.
 */
@RestController
@RequestMapping("/api/club/branches")
@RequiredArgsConstructor
public class ClubBranchController {

    private final ClubBranchService branchService;

    @GetMapping
    @PreAuthorize("hasAnyRole('CLUB_MEMBER','CLUB_LEADER','ADMIN')")
    public List<BranchResponse> list() {
        return branchService.listActiveForCaller();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLUB_MEMBER','CLUB_LEADER','ADMIN')")
    public BranchResponse getOne(@PathVariable Long id) {
        return branchService.getOneForCaller(id);
    }

    @GetMapping("/{id}/members")
    @PreAuthorize("hasAnyRole('CLUB_MEMBER','CLUB_LEADER','ADMIN')")
    public List<MemberResponse> listMembers(@PathVariable Long id) {
        return branchService.listMembers(id);
    }
}