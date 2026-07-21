package com.example.Innovation_backend.club;

import com.example.Innovation_backend.club.dto.MemberResponse;
import com.example.Innovation_backend.club.dto.StatusUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Status-mutation endpoints for club members.
 *
 *   PATCH /api/club/members/{id}/status   (leader | admin)   { status }
 *
 * The path uses {id} = ClubMember.id. SecurityConfig denies all PATCH on
 * /api/club/** except via @PreAuthorize annotations below.
 */
@RestController
@RequestMapping("/api/club/members")
@RequiredArgsConstructor
public class ClubMemberController {

    private final ClubMemberService memberService;

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('CLUB_LEADER','ADMIN')")
    public MemberResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest body) {
        return memberService.updateStatus(id, body);
    }
}